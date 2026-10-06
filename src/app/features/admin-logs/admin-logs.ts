import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LogService, Log } from '../../core/services/log.service';

@Component({
    selector: 'app-admin-logs',
    imports: [DatePipe],
    templateUrl: './admin-logs.html',
    styleUrl: './admin-logs.css',
})
export class AdminLogs implements OnInit {
    private logService = inject(LogService);

    logs = signal<Log[]>([]);
    cargando = signal(true);
    error = signal<string | null>(null);
    filtro = signal('todas');

    // Tipos de acción que existen, para armar el selector
    acciones = computed(() => [...new Set(this.logs().map(l => l.accion))]);

    logsFiltrados = computed(() =>
        this.filtro() === 'todas'
            ? this.logs()
            : this.logs().filter(l => l.accion === this.filtro())
    );

    async ngOnInit() {
        const logs = await this.logService.cargar();
        this.cargando.set(false);

        if (logs === null) {
            this.error.set('No se pudieron cargar los registros.');
            return;
        }
        this.logs.set(logs);
    }
}