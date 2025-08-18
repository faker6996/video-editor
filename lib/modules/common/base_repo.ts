// lib/db-utils/universal-repo.ts

import { safeQuery } from "@/lib/modules/common/safe_query";

export class BaseRepo {
  // #region modify methods

  // **Cách dùng**
  //
  // 1. Thêm bản ghi mới:
  //    await repo.insert({ name: "Bach", email: "a@gmail.com" } as User);
  //
  // 2. Class phải có static `table` (VD: User.table = "users")
  //
  // 3. Trả về bản ghi sau khi insert
  //
  // 4. Nếu không có field nào hợp lệ → throw lỗi

  async insert<T>(data: Partial<T>, returning: string = "*"): Promise<T> {
    // Lấy tên bảng từ static property trong class'

    const table = (data.constructor as any).table;
    if (!table) throw new Error("Missing static 'table' on model class.");

    const columns: string[] = [];
    const values: any[] = [];
    const params: string[] = [];
    let index = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        columns.push(key);
        values.push(value);
        params.push(`$${index++}`);
      }
    }

    if (columns.length === 0) {
      throw new Error("No valid data provided for insert.");
    }

    const sql = `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES (${params.join(", ")})
      RETURNING ${returning};
    `;

    const result = await safeQuery(sql, values);
    return result.rows[0];
  }

  // **Cách dùng**
  //
  // await repo.insertMany<User>([
  //   { name: "A", email: "a@gmail.com" } as User,
  //   { name: "B", email: "b@gmail.com" } as User,
  // ]);
  //
  // Class User phải có static table = "users"
  //
  // Tự động sinh câu lệnh INSERT INTO ... VALUES (...), (...)
  // Trả về mảng kết quả đã insert

  async insertMany<T>(items: Partial<T>[], returning: string = "*"): Promise<T[]> {
    if (!items || items.length === 0) {
      throw new Error("No data provided for batch insert.");
    }

    const table = (items[0].constructor as any).table;
    if (!table) throw new Error("Missing static 'table' on model class.");

    const columns: string[] = [];
    const allValues: any[] = [];
    const valueGroups: string[] = [];

    // Xác định các cột từ object đầu tiên
    for (const [key, value] of Object.entries(items[0])) {
      if (value !== undefined) columns.push(key);
    }

    if (columns.length === 0) {
      throw new Error("No valid columns found for insert.");
    }

    let paramIndex = 1;

    for (const item of items) {
      const values: string[] = [];
      for (const col of columns) {
        const val = (item as any)[col];
        allValues.push(val);
        values.push(`$${paramIndex++}`);
      }
      valueGroups.push(`(${values.join(", ")})`);
    }

    const sql = `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES ${valueGroups.join(", ")}
      RETURNING ${returning};
    `;

    // 🚀 Transaction bắt đầu
    await safeQuery("BEGIN");
    try {
      const result = await safeQuery(sql, allValues);
      await safeQuery("COMMIT");
      return result.rows;
    } catch (err) {
      await safeQuery("ROLLBACK");
      throw err;
    }
  }

  // **Cách dùng**
  //
  // await repo.update({ id: 5, name: "Updated Name" } as User);
  //
  // Yêu cầu: entity class có static `table`, và `data` được tạo từ class đó (hoặc có cùng prototype)

  async update<T extends { id?: any }>(data: Partial<T>, returning: string = "*"): Promise<T | null> {
    if (!data || !data.id) {
      throw new Error(`Missing "id" in data for update.`);
    }

    // Lấy table từ class prototype (yêu cầu entity class có static table)
    const table = (data.constructor as any).table;
    if (!table) throw new Error("Missing static 'table' on model class.");

    const values: any[] = [];
    const updates: string[] = [];
    let index = 1;

    for (const [key, value] of Object.entries(data)) {
      if (key === "id" || value === undefined) continue;
      updates.push(`${key} = $${index++}`);
      values.push(value);
    }

    if (updates.length === 0) {
      throw new Error("No fields to update.");
    }

    values.push(data.id);
    const whereIndex = `$${index}`;

    const sql = `
      UPDATE ${table}
      SET ${updates.join(", ")}
      WHERE id = ${whereIndex}
      RETURNING ${returning};
    `;

    const result = await safeQuery(sql, values);
    return result.rows[0] || null;
  }

  // #endregion

  // **Cách dùng**:
  //
  // 1. Mặc định sắp xếp theo "id DESC":
  //    await repo.getAll<User>("users");
  //
  // 2. Sắp theo 1 cột cụ thể:
  //    await repo.getAll<Message>("messages", {
  //      orderBy: ["created_at"],
  //      orderDirections: { created_at: "ASC" },
  //      allowedOrderFields: ["created_at"]
  //    });
  //
  // 3. Sắp theo nhiều cột:
  //    await repo.getAll<Message>("messages", {
  //      orderBy: ["created_at", "id"],
  //      orderDirections: { created_at: "DESC", id: "ASC" },
  //      allowedOrderFields: ["created_at", "id"]
  //    });
  //
  // 4. Nếu orderBy không hợp lệ → sẽ throw lỗi để chống SQL injection.

  async getAll<T>(
    modelClass: { new (data?: Partial<T>): T; table: string },
    options?: {
      orderBy?: (keyof T & string)[];
      orderDirections?: Record<string, "ASC" | "DESC">;
      allowedOrderFields?: (keyof T & string)[];
    }
  ): Promise<T[]> {
    /* 1️⃣  Xử lý ORDER BY */
    const allowed = options?.allowedOrderFields ?? (["id", "created_at"] as (keyof T & string)[]);
    const orderBy = options?.orderBy ?? (["id"] as (keyof T & string)[]);
    const orderDir = options?.orderDirections ?? {};

    const orderSQL = orderBy
      .map((col) => {
        if (!allowed.includes(col)) throw new Error(`Invalid orderBy field: "${String(col)}"`);
        const dir = orderDir[col] ?? "DESC";
        return `${col} ${dir}`;
      })
      .join(", ");

    /* 2️⃣  Query */
    const sql = `SELECT * FROM ${modelClass.table} ORDER BY ${orderSQL}`;
    const { rows } = await safeQuery(sql);

    /* 3️⃣  Map → instance */
    return rows.map((r) => new modelClass(r));
  }

  async getById<T>(modelClass: { new (data?: Partial<T>): T; table: string }, id: number): Promise<T | null> {
    const sql = `SELECT * FROM ${modelClass.table} WHERE id = $1`;
    const { rows } = await safeQuery(sql, [id]);

    return rows[0] ? new modelClass(rows[0]) : null;
  }

  // **Cách dùng**
  //
  // 1. Truy vấn theo bất kỳ field:
  //    const user = await repo.getByField<User>(User, "email", "abc@gmail.com");
  //
  // 2. Có thể sắp xếp kết quả nếu có nhiều bản ghi (ví dụ: getByField trả về nhiều rows):
  //    const messages = await repo.getByField<Message>(Messages, "conversation_id", "conv_123", {
  //      orderBy: ["created_at", "id"],
  //      orderDirections: { created_at: "DESC", id: "ASC" },
  //      allowedOrderFields: ["created_at", "id"]
  //    });
  //
  // 3. Nếu không tìm thấy bản ghi → trả về null hoặc [] tùy use case xử lý.

  // lib/base-repo.ts ----------------------------------------------------------

  /**
   * ModelClass:
   *   - có static table: string
   *   - constructor(data?: Partial<T>)
   */
  async getByField<T>(
    modelClass: { new (data?: Partial<T>): T; table: string },
    field: keyof T & string,
    value: any,
    options?: {
      /** Các cột muốn ORDER BY (mặc định []) */
      orderBy?: (keyof T & string)[];
      /** Hướng sắp xếp từng cột (ASC | DESC) */
      orderDirections?: Record<string, "ASC" | "DESC">;
      /** Danh sách cột được phép dùng ORDER BY (mặc định id, created_at) */
      allowedOrderFields?: (keyof T & string)[];
    }
  ): Promise<T | null> {
    // 1️⃣  Xử lý tuỳ chọn sắp xếp
    const allowed = options?.allowedOrderFields ?? (["id", "created_at"] as (keyof T & string)[]);
    const orderBy = options?.orderBy ?? [];
    const orderDir = options?.orderDirections ?? {};

    let orderClause = "";
    if (orderBy.length) {
      const clauses = orderBy.map((col) => {
        if (!allowed.includes(col)) throw new Error(`Invalid orderBy field: "${String(col)}"`);
        const dir = orderDir[col] ?? "DESC";
        return `${col} ${dir}`;
      });
      orderClause = ` ORDER BY ${clauses.join(", ")}`;
    }

    // 2️⃣  Chuẩn bị & chạy truy vấn
    const sql = `SELECT * FROM ${modelClass.table} WHERE ${field} = $1${orderClause}`;
    const { rows } = await safeQuery(sql, [value]);

    // 3️⃣  Trả về instance hoặc null
    return rows[0] ? new modelClass(rows[0]) : null;
  }

  // **Cách dùng**
  //
  // 1. Tìm bản ghi theo nhiều điều kiện:
  //    const messages = await repo.findManyByFields<Message>("messages", {
  //      conversation_id: "conv_001",
  //      sender_id: "user_123"
  //    });
  //
  // 2. Có thể sắp xếp:
  //    const results = await repo.findManyByFields<Message>("messages", {
  //      conversation_id: "conv_001"
  //    }, {
  //      orderBy: ["created_at"],
  //      orderDirections: { created_at: "DESC" },
  //      allowedOrderFields: ["created_at", "id"]
  //    });
  //
  // 3. Nếu không có bản ghi → trả về mảng rỗng []

  async findManyByFields<T>(
    modelClass: { new (data?: Partial<T>): T; table: string },
    conditions: Partial<Record<keyof T & string, any>>,
    options?: {
      orderBy?: (keyof T & string)[];
      orderDirections?: Record<string, "ASC" | "DESC">;
      allowedOrderFields?: (keyof T & string)[];
    }
  ): Promise<T[]> {
    /** 1️⃣  WHERE */
    const whereParts: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(conditions)) {
      whereParts.push(`${key} = $${idx++}`);
      values.push(val);
    }
    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    /** 2️⃣  ORDER BY */
    const allowed = options?.allowedOrderFields ?? (["id", "created_at"] as (keyof T & string)[]);
    const orderBy = options?.orderBy ?? [];
    const orderDir = options?.orderDirections ?? {};

    let orderSQL = "";
    if (orderBy.length) {
      const clauses = orderBy.map((col) => {
        if (!allowed.includes(col)) {
          throw new Error(`Invalid orderBy field: "${String(col)}"`);
        }
        const dir = orderDir[col] ?? "DESC";
        return `${col} ${dir}`;
      });
      orderSQL = ` ORDER BY ${clauses.join(", ")}`;
    }

    /** 3️⃣  Query */
    const sql = `SELECT * FROM ${modelClass.table} ${whereSQL}${orderSQL}`;
    const { rows } = await safeQuery(sql, values);

    /** 4️⃣  Map → instance */
    return rows.map((r) => new modelClass(r));
  }
  async deleteById<T>(modelClass: { table: string }, id: number): Promise<void> {
    if (!id) throw new Error("Missing 'id' parameter for delete.");

    const table = modelClass.table;
    if (!table) throw new Error("Missing static 'table' on model class.");

    const sql = `DELETE FROM ${table} WHERE id = $1`;
    await safeQuery(sql, [id]);
  }
  async deleteAll<T>(modelClass: { table: string }): Promise<number> {
    const table = modelClass.table;
    if (!table) throw new Error("Missing static 'table' on model class.");

    // DELETE trả về số dòng bị xoá, giữ lại sequence ID hiện tại
    const sql = `DELETE FROM ${table}`;
    const result = await safeQuery(sql); // result.rowCount trong PG

    return result.rowCount ?? 0; // trả về số bản ghi đã xoá
  }

  // #region Advanced helpers

  /**
   * Find many rows where a JSONB column contains key == value (as text)
   * Example: metadata->>'group_id' = 'uuid'
   */
  async findManyByJsonbKeyEq<T>(
    modelClass: { new (data?: Partial<T>): T; table: string },
    jsonbColumn: keyof T & string,
    key: string,
    value: string,
    options?: {
      orderBy?: (keyof T & string)[];
      orderDirections?: Record<string, "ASC" | "DESC">;
      allowedOrderFields?: (keyof T & string)[];
    }
  ): Promise<T[]> {
    const allowed = options?.allowedOrderFields ?? (["id", "created_at"] as (keyof T & string)[]);
    const orderBy = options?.orderBy ?? ([] as (keyof T & string)[]);
    const orderDir = options?.orderDirections ?? {};

    let orderSQL = "";
    if (orderBy.length) {
      const clauses = orderBy.map((col) => {
        if (!allowed.includes(col)) throw new Error(`Invalid orderBy field: "${String(col)}"`);
        const dir = orderDir[col] ?? "DESC";
        return `${col} ${dir}`;
      });
      orderSQL = ` ORDER BY ${clauses.join(", ")}`;
    }

    const sql = `SELECT * FROM ${modelClass.table} WHERE ${jsonbColumn}->>'${key}' = $1${orderSQL}`;
    const { rows } = await safeQuery(sql, [value]);
    return rows.map((r) => new modelClass(r));
  }

  /**
   * Count with simple equality conditions
   */
  async count<T>(
    modelClass: { table: string },
    conditions?: Partial<Record<keyof T & string, any>>
  ): Promise<number> {
    const whereParts: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (conditions) {
      for (const [k, v] of Object.entries(conditions)) {
        whereParts.push(`${k} = $${idx++}`);
        values.push(v);
      }
    }
    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
    const sql = `SELECT COUNT(*)::int AS cnt FROM ${modelClass.table} ${whereSQL}`;
    const { rows } = await safeQuery(sql, values);
    return rows[0]?.cnt ?? 0;
  }

  /**
   * Count with arbitrary WHERE clause (for complex operators)
   */
  async countWhere(
    modelClassOrTable: { table: string } | string,
    whereSQL: string,
    params: any[] = []
  ): Promise<number> {
    const table = typeof modelClassOrTable === 'string' ? modelClassOrTable : modelClassOrTable.table;
    const sql = `SELECT COUNT(*)::int AS cnt FROM ${table} WHERE ${whereSQL}`;
    const { rows } = await safeQuery(sql, params);
    return rows[0]?.cnt ?? 0;
  }

  /**
   * Batch update SET ... WHERE key IN (...)
   * Returns affected rows
   */
  async updateWhereIn(
    modelClassOrTable: { table: string } | string,
    set: Record<string, any>,
    key: string,
    valuesIn: any[]
  ): Promise<number> {
    if (!valuesIn.length) return 0;
    const table = typeof modelClassOrTable === 'string' ? modelClassOrTable : modelClassOrTable.table;

    const setParts: string[] = [];
    const params: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(set)) {
      setParts.push(`${k} = $${idx++}`);
      params.push(v);
    }

    const inPlaceholders = valuesIn.map(() => `$${idx++}`).join(', ');
    params.push(...valuesIn);

    const sql = `UPDATE ${table} SET ${setParts.join(', ')} WHERE ${key} IN (${inPlaceholders})`;
    const res = await safeQuery(sql, params);
    return res.rowCount ?? 0;
  }

  /**
   * Sum / Avg helpers with simple equality conditions
   */
  async sum<T>(
    modelClass: { table: string },
    column: keyof T & string,
    conditions?: Partial<Record<keyof T & string, any>>
  ): Promise<number> {
    const whereParts: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (conditions) {
      for (const [k, v] of Object.entries(conditions)) {
        whereParts.push(`${k} = $${idx++}`);
        values.push(v);
      }
    }
    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
    const sql = `SELECT COALESCE(SUM(${column}),0)::bigint AS s FROM ${modelClass.table} ${whereSQL}`;
    const { rows } = await safeQuery(sql, values);
    return parseInt(rows[0]?.s ?? 0);
  }

  async avg<T>(
    modelClass: { table: string },
    column: keyof T & string,
    conditions?: Partial<Record<keyof T & string, any>>
  ): Promise<number> {
    const whereParts: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (conditions) {
      for (const [k, v] of Object.entries(conditions)) {
        whereParts.push(`${k} = $${idx++}`);
        values.push(v);
      }
    }
    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
    const sql = `SELECT COALESCE(AVG(${column}),0) AS a FROM ${modelClass.table} ${whereSQL}`;
    const { rows } = await safeQuery(sql, values);
    return Number(rows[0]?.a ?? 0);
  }

  // #endregion
}

export const baseRepo = new BaseRepo();
