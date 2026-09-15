import { Component, computed, inject, input, signal, OnInit } from '@angular/core';
import { SalaService } from '../../core/services/sala.service';
import { FuncionesService } from '../../core/services/funciones.service';
import { Router } from '@angular/router';

@Component({
  imports: [],
  selector: 'app-sala',
  styleUrl: './sala.css',
  templateUrl: './sala.html',
})
export class Sala implements OnInit {
  private salaService = inject(SalaService);
  private funcionesService = inject(FuncionesService);
  
  funcionId = input.required<string>();
  
  filas = this.salaService.generarFilas();
  
  constructor(private router: Router) {}

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

  ngOnInit() {
    this.salaService.cargarButacasOcupadas(this.funcionId());
  }

    volverHome() {
    this.router.navigate(['/home']);
    }
}