import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductoCandyBarService } from '../../core/services/producto-candybar.service';
import { ProductoCandyBar } from '../../core/models/producto-candybar.interface';
import { LogService } from '../../core/services/log.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-admin-candy-bar',
  styleUrl: './admin-candy-bar.css',
  templateUrl: './admin-candy-bar.html',
})
export class AdminCandybar {
  private fb = inject(FormBuilder);
  candyBarService = inject(ProductoCandyBarService);
  private logService = inject(LogService)

  editandoId = signal<string | null>(null);
  guardando = signal(false);
  error = signal<string | null>(null);
  subiendoImagen = signal(false);


  productoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      precio: [0, [Validators.required, Validators.min(0)]],
      costoPuntos: [null as number | null, Validators.min(1)],
      categoria: ['', Validators.required],
      imagen: ['', Validators.required],
      disponible: [true],
  });

  async onSubmit() {
    if (this.productoForm.invalid) return;

    this.guardando.set(true);
    this.error.set(null);

    const valores = this.productoForm.value;
    const producto: Omit<ProductoCandyBar, 'id'> = {
      nombre: valores.nombre!,
      descripcion: valores.descripcion ?? '',
      precio: Number(valores.precio),
      costoPuntos: valores.costoPuntos ?? null,
      categoria: valores.categoria!,
      imagen: valores.imagen!,
      disponible: valores.disponible ?? true,
    };

    const id = this.editandoId();
    const anterior = id ? this.candyBarService.productos().find(p => p.id === id) : undefined;
    const exito = id
      ? await this.candyBarService.editarProducto(id, producto)
      : await this.candyBarService.agregarProducto(producto);

    this.guardando.set(false);

    if (exito) {
      if (!id) {
        await this.logService.registrar('Producto creado', `${producto.nombre}: $${producto.precio}`);
      } else if (anterior && anterior.precio !== producto.precio) {
        await this.logService.registrar('Modificación de precio', `${producto.nombre}: $${anterior.precio} → $${producto.precio}`);
      } else {
        await this.logService.registrar('Producto modificado', producto.nombre);
      }
      this.cancelarEdicion();
    } else {
      this.error.set('Hubo un error al guardar. Probá de nuevo.');
    }
  }

  editar(producto: ProductoCandyBar) {
    this.editandoId.set(producto.id);
    this.productoForm.setValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      costoPuntos: producto.costoPuntos ?? null,
      categoria: producto.categoria,
      imagen: producto.imagen,
      disponible: producto.disponible,
    });
  }

  cancelarEdicion() {
    this.editandoId.set(null);
    this.error.set(null);
    this.productoForm.reset({ precio: 0, costoPuntos: null, disponible: true });
  }

  async eliminar(id: string) {
    const confirmar = confirm('¿Seguro que querés eliminar este producto?');
    if (!confirmar) return;

    const producto = this.candyBarService.productos().find(p => p.id === id);
    const ok = await this.candyBarService.eliminarProducto(id);

    if (ok && producto) {
      await this.logService.registrar('Producto eliminado', producto.nombre);
    }
  }

  async onArchivoSeleccionado(event: Event) {
      const input = event.target as HTMLInputElement;
      const archivo = input.files?.[0];
      if (!archivo) return;

      if (!archivo.type.startsWith('image/')) {
          this.error.set('El archivo tiene que ser una imagen.');
          return;
      }

      this.subiendoImagen.set(true);
      this.error.set(null);

      const url = await this.candyBarService.subirImagen(archivo);

      this.subiendoImagen.set(false);

      if (!url) {
          this.error.set('No se pudo subir la imagen. Probá de nuevo.');
          return;
      }

      // Guardamos la URL en el mismo campo "imagen" que ya tenías
      this.productoForm.patchValue({ imagen: url });
  }
}