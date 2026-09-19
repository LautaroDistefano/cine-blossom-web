// ticket.service.ts
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface DatosTicket {
    peliculaNombre: string;
    horario: string;
    formato: string;
    idioma: string;
    butacas: string[];
    candyBar: { nombre: string; cantidad: number; precioUnitario: number }[];
    total: number;
    codigoQr: string;
}

@Injectable({ providedIn: 'root' })
export class TicketService {

    async generarPdf(datos: DatosTicket): Promise<void> {
        const qrDataUrl = await QRCode.toDataURL(datos.codigoQr, { width: 200 });

        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Cine Blossom', 20, 20);

        doc.setFontSize(14);
        doc.text(datos.peliculaNombre, 20, 35);

        doc.setFontSize(10);
        doc.text(`Horario: ${new Date(datos.horario).toLocaleString('es-AR')}`, 20, 45);
        doc.text(`Formato: ${datos.formato} — Idioma: ${datos.idioma}`, 20, 52);
        doc.text(`Butacas: ${datos.butacas.join(', ')}`, 20, 59);

        let y = 70;
        if (datos.candyBar.length > 0) {
            doc.text('Candy bar:', 20, y);
            y += 7;
            for (const item of datos.candyBar) {
                doc.text(`  ${item.cantidad}x ${item.nombre} — $${item.precioUnitario * item.cantidad}`, 20, y);
                y += 6;
            }
        }

        doc.setFontSize(12);
        doc.text(`Total: $${datos.total}`, 20, y + 8);

        doc.addImage(qrDataUrl, 'PNG', 140, 20, 50, 50);

        doc.save(`entrada-${datos.codigoQr.slice(0, 8)}.pdf`);
    }
}