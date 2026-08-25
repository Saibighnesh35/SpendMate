"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Category,
  PaymentMethod,
  Transaction,
  TransactionInput,
} from "@/types";

import { findPotentialDuplicate } from "@/lib/duplicates";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_CATEGORIES = [
  ["Food", "#f59e5b"],
  ["Groceries", "#eab308"],
  ["Travel", "#5a9cf5"],
  ["Shopping", "#b578e9"],
  ["Education", "#38a996"],
  ["Entertainment", "#ed7294"],
  ["Bills", "#64748b"],
  ["Health", "#ef6262"],
  ["Hostel / Rent", "#a07256"],
  ["Personal", "#4ab7c9"],
  ["Others", "#94a3b8"],
] as const;

const DEFAULT_PAYMENT_METHODS = [
  ["GPay", "upi"],
  ["PhonePe", "upi"],
  ["Super.Money", "upi"],
  ["Paytm", "upi"],
  ["Cash", "cash"],
  ["Debit Card", "card"],
  ["Credit Card", "card"],
  ["Bank Transfer", "bank"],
  ["UPI", "upi"],
  ["Other", "other"],
] as const;

type AppUser = {
  id: string;
  name: string;
  email: string;
} | null;

type Store = {
  user: AppUser;
  loading: boolean;

  transactions: Transaction[];
  categories: Category[];
  methods: PaymentMethod[];

  addTransaction(
    input: TransactionInput,
    allowDuplicate?: boolean
  ): Promise<{
    transaction?: Transaction;
    duplicate?: Transaction;
  }>;

  updateTransaction(
    id: string,
    input: TransactionInput
  ): Promise<void>;

  deleteTransaction(id: string): Promise<void>;

  addCategory(name: string): Promise<void>;
  renameCategory(id: string, name: string): Promise<void>;
  addMethod(name: string): Promise<void>;

  deleteAttachment(id: string): Promise<void>;

  login(
    name: string,
    email: string,
    password: string
  ): Promise<{ error?: string }>;

  logout(): Promise<void>;
  clearRecent(): void;
};

const Ctx = createContext<Store | null>(null);

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color ?? "#1e8b62",
    active: row.is_active ?? true,
  };
}

function mapPaymentMethod(row: any): PaymentMethod {
  return {
    id: row.id,
    name: row.name,
    icon:
      row.kind === "cash"
        ? "₹"
        : row.kind === "card"
          ? "▣"
          : "◉",
    active: row.is_active ?? true,
  };
}

function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    amountMinor: Number(row.amount_minor),
    currency: row.currency_code ?? "INR",
    type: row.type,
    transactionDate: row.transaction_date,
    categoryId: row.category_id ?? undefined,
    paymentMethodId: row.payment_method_id,
    merchant: row.merchant ?? undefined,
    note: row.note ?? undefined,
    source:
      row.source === "SCREENSHOT"
        ? "SCREENSHOT"
        : "MANUAL",
    createdAt: row.created_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

export function DemoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<AppUser>(null);
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<Transaction[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [pays, setPays] = useState<PaymentMethod[]>([]);

  const ensureProfile = useCallback(
    async (authUser: {
      id: string;
      email?: string;
      user_metadata?: Record<string, any>;
    }) => {
      const metadataName =
        typeof authUser.user_metadata?.full_name ===
        "string"
          ? authUser.user_metadata.full_name.trim()
          : "";

      const { data: existing, error } =
        await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", authUser.id)
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!existing) {
        const fallbackName =
          metadataName ||
          authUser.email?.split("@")[0] ||
          "Student";

        const { error: insertError } =
          await supabase.from("profiles").insert({
            id: authUser.id,
            full_name: fallbackName,
            currency_code: "INR",
            timezone: "Asia/Kolkata",
          });

        if (insertError) {
          throw insertError;
        }

        return {
          id: authUser.id,
          name: fallbackName,
          email: authUser.email ?? "",
        };
      }

      return {
        id: authUser.id,
        name:
          existing.full_name?.trim() ||
          metadataName ||
          authUser.email?.split("@")[0] ||
          "Student",
        email: authUser.email ?? "",
      };
    },
    [supabase]
  );

  const ensureDefaults = useCallback(
    async (userId: string) => {
      const {
        data: existingCategories,
        error: categoryReadError,
      } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
          ascending: true,
        });

      if (categoryReadError) {
        throw categoryReadError;
      }

      const categoryRows = existingCategories ?? [];

      const existingCategoryNames = new Set(
        categoryRows.map((row) =>
          String(row.name)
            .trim()
            .toLowerCase()
        )
      );

      const missingCategories =
        DEFAULT_CATEGORIES.filter(
          ([name]) =>
            !existingCategoryNames.has(
              name.toLowerCase()
            )
        );

      if (missingCategories.length > 0) {
        const { error } =
          await supabase
            .from("categories")
            .insert(
              missingCategories.map(
                ([name, color]) => ({
                  user_id: userId,
                  name,
                  color,
                  is_default: true,
                  is_active: true,
                })
              )
            );

        if (error) {
          throw error;
        }
      }

      const {
        data: finalCategories,
        error: categoryFinalError,
      } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", {
          ascending: true,
        });

      if (categoryFinalError) {
        throw categoryFinalError;
      }

      const {
        data: existingMethods,
        error: methodReadError,
      } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
          ascending: true,
        });

      if (methodReadError) {
        throw methodReadError;
      }

      const methodRows = existingMethods ?? [];

      const existingMethodNames = new Set(
        methodRows.map((row) =>
          String(row.name)
            .trim()
            .toLowerCase()
        )
      );

      const missingMethods =
        DEFAULT_PAYMENT_METHODS.filter(
          ([name]) =>
            !existingMethodNames.has(
              name.toLowerCase()
            )
        );

      if (missingMethods.length > 0) {
        const { error } =
          await supabase
            .from("payment_methods")
            .insert(
              missingMethods.map(
                ([name, kind]) => ({
                  user_id: userId,
                  name,
                  kind,
                  is_default: true,
                  is_active: true,
                })
              )
            );

        if (error) {
          throw error;
        }
      }

      const {
        data: finalMethods,
        error: methodFinalError,
      } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", {
          ascending: true,
        });

      if (methodFinalError) {
        throw methodFinalError;
      }

      setCats(
        (finalCategories ?? []).map(mapCategory)
      );

      setPays(
        (finalMethods ?? []).map(
          mapPaymentMethod
        )
      );
    },
    [supabase]
  );

  const loadTransactions = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("transaction_date", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setItems(
        (data ?? []).map(mapTransaction)
      );
    },
    [supabase]
  );

  const loadUserData = useCallback(
    async (authUser: {
      id: string;
      email?: string;
      user_metadata?: Record<string, any>;
    }) => {
      try {
        const profile =
          await ensureProfile(authUser);

        setUser(profile);

        await ensureDefaults(authUser.id);
        await loadTransactions(authUser.id);
      } catch (error) {
        console.error(
          "Failed to load SpendMate data:",
          error
        );

        /*
         * Important:
         * Don't immediately sign the user out just because
         * profile/data loading failed.
         *
         * Keep the authenticated user and let the UI show
         * an empty data state instead of redirecting to login.
         */
        setItems([]);
        setCats([]);
        setPays([]);
      } finally {
        setLoading(false);
      }
    },
    [
      ensureDefaults,
      ensureProfile,
      loadTransactions,
    ]
  );

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error(
          "Failed to restore Supabase session:",
          error
        );

        setLoading(false);
        return;
      }

      if (session?.user) {
        await loadUserData(session.user);
      } else {
        setUser(null);
        setItems([]);
        setCats([]);
        setPays([]);
        setLoading(false);
      }
    };

    void restoreSession();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!mounted) return;

          /*
           * INITIAL_SESSION is already handled by
           * getSession() above.
           */
          if (event === "INITIAL_SESSION") {
            return;
          }

          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "USER_UPDATED"
          ) {
            if (session?.user) {
              void loadUserData(
                session.user
              );
            }

            return;
          }

          if (event === "SIGNED_OUT") {
            setUser(null);
            setItems([]);
            setCats([]);
            setPays([]);
            setLoading(false);
          }
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData, supabase]);

  const addTransaction = useCallback(
    async (
      input: TransactionInput,
      allowDuplicate = false
    ) => {
      const duplicate =
        findPotentialDuplicate(
          input,
          items
        );

      if (
        duplicate &&
        !allowDuplicate
      ) {
        return { duplicate };
      }

      const {
        data: { user: authUser },
      } =
        await supabase.auth.getUser();

      if (!authUser) {
        throw new Error(
          "Authentication required."
        );
      }

      const { data, error } =
        await supabase
          .from("transactions")
          .insert({
            user_id: authUser.id,
            amount_minor:
              input.amountMinor,
            type: input.type,
            transaction_date:
              input.transactionDate,
            category_id:
              input.categoryId ?? null,
            payment_method_id:
              input.paymentMethodId,
            merchant:
              input.merchant ?? null,
            note:
              input.note ?? null,
            source: input.source,
            currency_code: "INR",
          })
          .select("*")
          .single();

      if (error) {
        console.error(
          "Failed to create transaction:",
          error
        );

        throw error;
      }

      const transaction =
        mapTransaction(data);

      setItems((current) => [
        transaction,
        ...current,
      ]);

      return { transaction };
    },
    [items, supabase]
  );

  const updateTransaction = useCallback(
    async (
      id: string,
      input: TransactionInput
    ) => {
      const {
        data: { user: authUser },
      } =
        await supabase.auth.getUser();

      if (!authUser) {
        throw new Error(
          "Authentication required."
        );
      }

      const { data, error } =
        await supabase
          .from("transactions")
          .update({
            amount_minor:
              input.amountMinor,
            type: input.type,
            transaction_date:
              input.transactionDate,
            category_id:
              input.categoryId ?? null,
            payment_method_id:
              input.paymentMethodId,
            merchant:
              input.merchant ?? null,
            note:
              input.note ?? null,
            source: input.source,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", id)
          .eq("user_id", authUser.id)
          .select("*")
          .single();

      if (error) {
        console.error(
          "Failed to update transaction:",
          error
        );

        throw error;
      }

      const transaction =
        mapTransaction(data);

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? transaction
            : item
        )
      );
    },
    [supabase]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const {
        data: { user: authUser },
      } =
        await supabase.auth.getUser();

      if (!authUser) {
        throw new Error(
          "Authentication required."
        );
      }

      const { error } =
        await supabase
          .from("transactions")
          .update({
            deleted_at:
              new Date().toISOString(),
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", id)
          .eq("user_id", authUser.id);

      if (error) {
        console.error(
          "Failed to delete transaction:",
          error
        );

        throw error;
      }

      setItems((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );
    },
    [supabase]
  );

  const addCategory = useCallback(
    async (name: string) => {
      const trimmed = name.trim();

      if (!trimmed) return;

      const {
        data: { user: authUser },
      } =
        await supabase.auth.getUser();

      if (!authUser) {
        throw new Error(
          "Authentication required."
        );
      }

      const { data, error } =
        await supabase
          .from("categories")
          .insert({
            user_id: authUser.id,
            name: trimmed,
            color: "#1e8b62",
            is_default: false,
            is_active: true,
          })
          .select("*")
          .single();

      if (error) throw error;

      setCats((current) => [
        ...current,
        mapCategory(data),
      ]);
    },
    [supabase]
  );

  const renameCategory = useCallback(
    async (
      id: string,
      name: string
    ) => {
      const trimmed = name.trim();

      if (!trimmed) return;

      const { data, error } =
        await supabase
          .from("categories")
          .update({
            name: trimmed,
          })
          .eq("id", id)
          .select("*")
          .single();

      if (error) throw error;

      setCats((current) =>
        current.map((category) =>
          category.id === id
            ? mapCategory(data)
            : category
        )
      );
    },
    [supabase]
  );

  const addMethod = useCallback(
    async (name: string) => {
      const trimmed = name.trim();

      if (!trimmed) return;

      const {
        data: { user: authUser },
      } =
        await supabase.auth.getUser();

      if (!authUser) {
        throw new Error(
          "Authentication required."
        );
      }

      const { data, error } =
        await supabase
          .from("payment_methods")
          .insert({
            user_id: authUser.id,
            name: trimmed,
            kind: "other",
            is_default: false,
            is_active: true,
          })
          .select("*")
          .single();

      if (error) throw error;

      setPays((current) => [
        ...current,
        mapPaymentMethod(data),
      ]);
    },
    [supabase]
  );

  const deleteAttachment =
    useCallback(
      async (id: string) => {
        const {
          data: { user: authUser },
        } =
          await supabase.auth.getUser();

        if (!authUser) {
          throw new Error(
            "Authentication required."
          );
        }

        const { error } =
          await supabase
            .from(
              "transaction_attachments"
            )
            .update({
              deleted_at:
                new Date().toISOString(),
            })
            .eq("id", id)
            .eq(
              "user_id",
              authUser.id
            );

        if (error) throw error;
      },
      [supabase]
    );

  const login = useCallback(
    async (
      _name: string,
      email: string,
      password: string
    ) => {
      const { error } =
        await supabase.auth.signInWithPassword(
          {
            email: email.trim(),
            password,
          }
        );

      if (error) {
        return {
          error: error.message,
        };
      }

      return {};
    },
    [supabase]
  );

  const logout = useCallback(
    async () => {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "Logout failed:",
          error
        );
        throw error;
      }

      setUser(null);
      setItems([]);
      setCats([]);
      setPays([]);
    },
    [supabase]
  );

  const clearRecent = useCallback(
    () => {},
    []
  );

  const value = useMemo<Store>(
    () => ({
      user,
      loading,
      transactions: items,
      categories: cats,
      methods: pays,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      renameCategory,
      addMethod,
      deleteAttachment,
      login,
      logout,
      clearRecent,
    }),
    [
      user,
      loading,
      items,
      cats,
      pays,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      renameCategory,
      addMethod,
      deleteAttachment,
      login,
      logout,
      clearRecent,
    ]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export function useSpendMate() {
  const value = useContext(Ctx);

  if (!value) {
    throw new Error(
      "SpendMate provider missing"
    );
  }

  return value;
}