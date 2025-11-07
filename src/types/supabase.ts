export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      blogs: {
        Row: {
          contents: string | null
          created_at: string
          id: string
          image: string | null
          nick_name: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          contents?: string | null
          created_at?: string
          id?: string
          image?: string | null
          nick_name?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          contents?: string | null
          created_at?: string
          id?: string
          image?: string | null
          nick_name?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat: {
        Row: {
          created_at: string
          id: string
          title: string
          userId: string
          visibility: Database["public"]["Enums"]["chat_visibility"]
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          userId?: string
          visibility?: Database["public"]["Enums"]["chat_visibility"]
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          userId?: string
          visibility?: Database["public"]["Enums"]["chat_visibility"]
        }
        Relationships: []
      }
      cheerup: {
        Row: {
          created_at: string
          id: string
          postid: string | null
          userid: string | null
        }
        Insert: {
          created_at?: string
          id: string
          postid?: string | null
          userid?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          postid?: string | null
          userid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cheerup_postid_fkey"
            columns: ["postid"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheerup_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Contracts: {
        Row: {
          created_at: string
          created_by: string | null
          gather_name: string | null
          id: string
          place_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          gather_name?: string | null
          id?: string
          place_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          gather_name?: string | null
          id?: string
          place_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "userinfo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Contracts_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "Places"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          content: string | null
          createdAt: string
          id: string
          imageUrl: string | null
          sellerId: string
        }
        Insert: {
          content?: string | null
          createdAt?: string
          id?: string
          imageUrl?: string | null
          sellerId?: string
        }
        Update: {
          content?: string | null
          createdAt?: string
          id?: string
          imageUrl?: string | null
          sellerId?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_sellerId_fkey1"
            columns: ["sellerId"]
            isOneToOne: false
            referencedRelation: "userinfo"
            referencedColumns: ["id"]
          },
        ]
      }
      iffy: {
        Row: {
          age: number
          brand: string
          commentary: string
          created_at: string
          desc: string
          gift_image_url: string
          gift_name: string
          humor: string
          id: string
          is_error: boolean
          is_person: boolean
          link: string
          product_img_url: string | null
          status: string
          style_prompt: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          age?: number
          brand?: string
          commentary?: string
          created_at?: string
          desc?: string
          gift_image_url?: string
          gift_name?: string
          humor?: string
          id?: string
          is_error?: boolean
          is_person?: boolean
          link?: string
          product_img_url?: string | null
          status?: string
          style_prompt?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          age?: number
          brand?: string
          commentary?: string
          created_at?: string
          desc?: string
          gift_image_url?: string
          gift_name?: string
          humor?: string
          id?: string
          is_error?: boolean
          is_person?: boolean
          link?: string
          product_img_url?: string | null
          status?: string
          style_prompt?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          blog_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          blog_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          blog_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blog_likes"
            referencedColumns: ["blog_id"]
          },
          {
            foreignKeyName: "likes_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      message: {
        Row: {
          chatId: string
          content: Json
          created_at: string
          id: string
          role: string
        }
        Insert: {
          chatId: string
          content: Json
          created_at?: string
          id?: string
          role?: string
        }
        Update: {
          chatId?: string
          content?: Json
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_chatId_fkey"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "chat"
            referencedColumns: ["id"]
          },
        ]
      }
      "nano-banana": {
        Row: {
          created_at: string
          gen_category: string
          id: string
          image_url: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          gen_category: string
          id?: string
          image_url: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          gen_category?: string
          id?: string
          image_url?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      Places: {
        Row: {
          created_at: string
          created_by: string | null
          deadline: string | null
          gather_name: string | null
          id: string
          lat: number | null
          long: number | null
          region: string | null
          sports_name: string | null
          texts: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          gather_name?: string | null
          id?: string
          lat?: number | null
          long?: number | null
          region?: string | null
          sports_name?: string | null
          texts?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          gather_name?: string | null
          id?: string
          lat?: number | null
          long?: number | null
          region?: string | null
          sports_name?: string | null
          texts?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Places_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "userinfo"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          avatar: string | null
          contents: string | null
          created_at: string
          email: string | null
          id: string
          likecount: number | null
          nickname: string | null
        }
        Insert: {
          avatar?: string | null
          contents?: string | null
          created_at?: string
          email?: string | null
          id: string
          likecount?: number | null
          nickname?: string | null
        }
        Update: {
          avatar?: string | null
          contents?: string | null
          created_at?: string
          email?: string | null
          id?: string
          likecount?: number | null
          nickname?: string | null
        }
        Relationships: []
      }
      realtimeone: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "realtimeone_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "userinfo"
            referencedColumns: ["id"]
          },
        ]
      }
      scenery: {
        Row: {
          createdAt: string
          id: string
          idioms: string[] | null
          imgPrompt: string
          imgUrl: string
          musicPrompt: string
          musicUrl: string
          updatedAt: string
          userEmail: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          idioms?: string[] | null
          imgPrompt?: string
          imgUrl?: string
          musicPrompt?: string
          musicUrl?: string
          updatedAt?: string
          userEmail?: string
          userId?: string
        }
        Update: {
          createdAt?: string
          id?: string
          idioms?: string[] | null
          imgPrompt?: string
          imgUrl?: string
          musicPrompt?: string
          musicUrl?: string
          updatedAt?: string
          userEmail?: string
          userId?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          created_at: string | null
          id: number
          signal: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          signal?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: number
          signal?: Json | null
        }
        Relationships: []
      }
      userinfo: {
        Row: {
          email: string | null
          id: string
          profile_image: string | null
          username: string | null
        }
        Insert: {
          email?: string | null
          id?: string
          profile_image?: string | null
          username?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          profile_image?: string | null
          username?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string
          email: string | null
          id: string
          introduction: string | null
          nickname: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email?: string | null
          id: string
          introduction?: string | null
          nickname?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string | null
          id?: string
          introduction?: string | null
          nickname?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      blog_likes: {
        Row: {
          blog_id: string | null
          contents: string | null
          like_count: number | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      chat_visibility: "public" | "private"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      chat_visibility: ["public", "private"],
    },
  },
} as const
