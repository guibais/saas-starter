// Definição básica de tipos para o banco de dados Supabase
export type Database = {
  public: {
    Tables: {
      // Tabelas definidas no seu banco Supabase
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
        };
      };
      // Defina outras tabelas conforme necessário
    };
    // Defina buckets de storage
    Buckets: {
      products: {
        // Propriedades do bucket 'products'
      };
      plans: {
        // Propriedades do bucket 'plans'
      };
      profiles: {
        // Propriedades do bucket 'profiles'
      };
    };
  };
};
