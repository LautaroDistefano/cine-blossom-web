// sala.service.ts
import { computed, inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ProductoCandyBar } from '../models/producto-candybar.interface';

export interface ProductoRow{
    id: string,
    nombre: string,
    descripcion: string,
    precio: number,
    costo_puntos: number | null,
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
            costoPuntos: row.costo_puntos,
            categoria: row.categoria,
            imagen: row.imagen,
            disponible: row.disponible 
        }
    }

    // Devuelve un array de { categoria, productos } para poder iterar agrupado
    productosPorCategoria = computed(() => {
        const productos = this.productosSignal();
        const categorias = [...new Set(productos.map(p => p.categoria))];

        // Las categorías que empiezan con "combo" van primero
        const esCombo = (categoria: string) => categoria.toLowerCase().startsWith('combo');
        categorias.sort((a, b) => Number(esCombo(b)) - Number(esCombo(a)));

        return categorias.map(categoria => ({
            categoria,
            productos: productos.filter(p => p.categoria === categoria)
        }));
    });

    async agregarProducto(producto: Omit<ProductoCandyBar, 'id'>): Promise<boolean> {
        const { error } = await this.supabase.from('productos_candybar').insert({
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio,
            costo_puntos: producto.costoPuntos ?? null,
            categoria: producto.categoria,
            imagen: producto.imagen,
            disponible: producto.disponible
        });

        if (error) {
            console.error('Error al agregar producto:', error);
            return false;
        }

        await this.cargarProductos();
        return true;
    }

    async editarProducto(id: string, cambios: Omit<ProductoCandyBar, 'id'>): Promise<boolean> {
        const { error } = await this.supabase.from('productos_candybar').update({
            nombre: cambios.nombre,
            descripcion: cambios.descripcion,
            precio: cambios.precio,
            costo_puntos: cambios.costoPuntos ?? null,
            categoria: cambios.categoria,
            imagen: cambios.imagen,
            disponible: cambios.disponible
        }).eq('id', id);

        if (error) {
            console.error('Error al editar producto:', error);
            return false;
        }

        await this.cargarProductos();
        return true;
    }

    async eliminarProducto(id: string): Promise<boolean> {
        const { error } = await this.supabase.from('productos_candybar').delete().eq('id', id);

        if (error) {
            console.error('Error al eliminar producto:', error);
            return false;
        }

        await this.cargarProductos();
        return true;
    }
}

