import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductoCandyBarService } from '../../core/services/producto-candybar.service';
import { ProductoCandyBar } from '../../core/models/producto-candybar.interface';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-admin-candy-bar',
  styleUrl: './admin-candy-bar.css',
  templateUrl: './admin-candy-bar.html',
})
export class AdminCandybar {
  private fb = inject(FormBuilder);
  candyBarService = inject(ProductoCandyBarService);

  editandoId = signal<string | null>(null);
  guardando = signal(false);
  error = signal<string | null>(null);

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
    const exito = id
      ? await this.candyBarService.editarProducto(id, producto)
      : await this.candyBarService.agregarProducto(producto);

    this.guardando.set(false);

    if (exito) {
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
    await this.candyBarService.eliminarProducto(id);
  }
}