import { Injectable } from '@angular/core';
import { environment } from '../../environments/environments';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabase.url,
            environment.supabase.publicKey
        );
    }

    get client(): SupabaseClient {
        return this.supabase;
    }
}