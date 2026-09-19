// sala.service.ts
import { computed, inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ProductoCandyBar } from '../models/producto-candybar.interface';

export interface ProductoRow{
    // id, nombre, descripcion, precio, categoria, imagen, disponible.
    id: string,
    nombre: string,
    descripcion: string,
    precio: number,
    categoria: string,
    imagen: string,
    disponible: boolean 
}

@Injectable({ providedIn: 'root' })
export class ProductoCandyBarService {
    private supabase = inject(SupabaseService).client;

    private productosSignal = signal<ProductoCandyBar[]>([]);

    cargando = signal(false);
    error = signal<string | null>(null);

    productos = computed(() => this.productosSignal())

    constructor(){
        this.cargarProductos()
    }

    async cargarProductos(){
        this.cargando.set(true);
        this.error.set(null);

        const {data, error} = await this.supabase
        .from('productos_candybar')
        .select('*')
        
        if(error){
            console.error('Error al cargar películas desde Supabase:', error);
            this.error.set(error.message);
            this.cargando.set(false);
            return;
        }

        const misProductos = (data as ProductoRow[]).map(row => this.mapearFila(row));
        this.productosSignal.set(misProductos)
        this.cargando.set(false);
        console.log(`Se cargaron ${misProductos.length} películas desde mi Supabase`);
        return;
    }

    mapearFila(row: ProductoRow): ProductoCandyBar{
        return{
            id: row.id,
            nombre: row.nombre,
            descripcion: row.descripcion,
            precio: row.precio,
            categoria: row.categoria,
            imagen: row.imagen,
            disponible: row.disponible 
        }
    }

    // Devuelve un array de { categoria, productos } para poder iterar agrupado
    productosPorCategoria = computed(() => {
        const productos = this.productosSignal();
        const categorias = [...new Set(productos.map(p => p.categoria))];

        return categorias.map(categoria => ({
            categoria,
            productos: productos.filter(p => p.categoria === categoria)
        }));
    });
}

