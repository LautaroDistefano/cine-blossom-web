import { Component, computed, inject, input, signal, OnInit } from '@angular/core';
import { SalaService } from '../../core/services/sala.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { Router } from '@angular/router';
import { EntradaService } from '../../core/services/entrada.service';

@Component({
  imports: [],
  selector: 'app-sala',
  styleUrl: './sala.css',
  templateUrl: './sala.html',
})
export class Sala implements OnInit {
  private salaService = inject(SalaService);
  private entradaService = inject(EntradaService);
  private router = inject(Router);

  reservando = signal(false);
    
  funcionId = input.required<string>();
  
  filas = this.salaService.generarFilas();

  filasConButacas = computed(() => 
      this.filas.map(fila => ({
          ...fila,
          bloques: this.salaService.generarBloquesDeFila(fila)
      }))
  );

  // Esto es lo que faltaba: el estado de qué butacas eligió el usuario
  butacasSeleccionadas = signal<string[]>([]);

  toggleButaca(codigo: string) {
    this.butacasSeleccionadas.update(actuales => 
        actuales.includes(codigo)
            ? actuales.filter(b => b !== codigo)
            : [...actuales, codigo]
    );
  }
  
  async confirmarReserva() {
      const seleccion = this.butacasSeleccionadas();
  
      if (seleccion.length === 0) {
          return; // no dejar confirmar sin butacas elegidas
      }
  
      this.reservando.set(true);
  
      // Precio simplificado por ahora: fijo por butaca, sin distinguir categoría todavía
      const precioPorButaca = 3000;
      const total = seleccion.length * precioPorButaca;
  
      const exito = await this.entradaService.reservar(this.funcionId(), seleccion, total);
  
      this.reservando.set(false);
  
      if (exito) {
          alert(`¡Reserva confirmada! Butacas: ${seleccion.join(', ')}`);
          this.router.navigate(['/home']);
      } else {
          alert('Hubo un error al confirmar la reserva. Probá de nuevo.');
        }
      }

  ngOnInit() {
    this.salaService.cargarButacasOcupadas(this.funcionId());
  }

    volverHome() {
    this.router.navigate(['/home']);
    }
}