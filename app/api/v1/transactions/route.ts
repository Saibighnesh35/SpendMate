import { NextRequest, NextResponse } from "next/server";

import { transactionSchema } from "@/lib/validation";
import { createServerClient } from "@/lib/supabase/server";

async function authenticated() {
  const client = await createServerClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  return { client, user };
}

export async function GET(request: NextRequest) {
  try {
    const { client, user } = await authenticated();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const params = request.nextUrl.searchParams;

    const offset = Number(params.get("offset") ?? 0);
    const limit = Math.min(
      Number(params.get("limit") ?? 30),
      100
    );

    let query = client
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("transaction_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (params.get("type")) {
      query = query.eq("type", params.get("type"));
    }

    if (params.get("categoryId")) {
      query = query.eq(
        "category_id",
        params.get("categoryId")
      );
    }

    if (params.get("paymentMethodId")) {
      query = query.eq(
        "payment_method_id",
        params.get("paymentMethodId")
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error(
      "GET /api/v1/transactions error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "We couldn't load transactions. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { client, user } = await authenticated();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const parsed = transactionSchema.safeParse(
      await request.json()
    );

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please check the transaction details.",
          issues: parsed.error.flatten(),
        },
        { status: 422 }
      );
    }

    const input = parsed.data;

    const { data, error } = await client
      .from("transactions")
      .insert({
        user_id: user.id,
        amount_minor: input.amountMinor,
        type: input.type,
        transaction_date: input.transactionDate,
        category_id: input.categoryId ?? null,
        payment_method_id: input.paymentMethodId,
        merchant: input.merchant ?? null,
        note: input.note ?? null,
        source: input.source,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { data },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/v1/transactions error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "We couldn't save this transaction. Please try again.",
      },
      { status: 500 }
    );
  }
}
