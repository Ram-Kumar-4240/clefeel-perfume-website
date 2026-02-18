const { query } = require('../config/database');
const slugify = require('slugify');

const PerfumeModel = {
  async create(perfumeData) {
    const { 
      name, 
      description, 
      shortDescription, 
      gender, 
      brand = 'Clefeel',
      category,
      images = [],
      isFeatured = false,
      metaTitle,
      metaDescription,
      variants = []
    } = perfumeData;

    const slug = slugify(name, { lower: true, strict: true });

    const client = await query('BEGIN');
    
    try {
      // Create perfume
      const perfumeResult = await query(
        `INSERT INTO perfumes (name, slug, description, short_description, gender, brand, category, images, is_featured, meta_title, meta_description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [name, slug, description, shortDescription, gender, brand, category, JSON.stringify(images), isFeatured, metaTitle, metaDescription]
      );

      const perfume = perfumeResult.rows[0];

      // Create variants
      if (variants.length > 0) {
        for (const variant of variants) {
          const sku = `${slug}-${variant.size}`.toUpperCase().replace(/\s/g, '-');
          await query(
            `INSERT INTO variants (perfume_id, size, price, stock_quantity, sku)
             VALUES ($1, $2, $3, $4, $5)`,
            [perfume.id, variant.size, variant.price, variant.stock || 0, sku]
          );
        }
      }

      await query('COMMIT');
      return this.findById(perfume.id);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  },

  async findById(id) {
    const result = await query(
      `SELECT p.*, 
        json_agg(json_build_object(
          'id', v.id,
          'size', v.size,
          'price', v.price,
          'stock_quantity', v.stock_quantity,
          'sku', v.sku,
          'is_active', v.is_active
        )) as variants
       FROM perfumes p
       LEFT JOIN variants v ON p.id = v.perfume_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findBySlug(slug) {
    const result = await query(
      `SELECT p.*, 
        json_agg(json_build_object(
          'id', v.id,
          'size', v.size,
          'price', v.price,
          'stock_quantity', v.stock_quantity,
          'sku', v.sku,
          'is_active', v.is_active
        ) ORDER BY v.price) as variants
       FROM perfumes p
       LEFT JOIN variants v ON p.id = v.perfume_id AND v.is_active = true
       WHERE p.slug = $1 AND p.is_active = true
       GROUP BY p.id`,
      [slug]
    );
    return result.rows[0] || null;
  },

  async findAll(filters = {}) {
    const { gender, minPrice, maxPrice, sortBy = 'created_at', sortOrder = 'DESC', limit = 50, offset = 0 } = filters;
    
    let whereClause = 'WHERE p.is_active = true';
    const params = [];
    let paramIndex = 1;

    if (gender) {
      whereClause += ` AND p.gender = $${paramIndex}`;
      params.push(gender);
      paramIndex++;
    }

    if (minPrice) {
      whereClause += ` AND EXISTS (SELECT 1 FROM variants v WHERE v.perfume_id = p.id AND v.price >= $${paramIndex})`;
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice) {
      whereClause += ` AND EXISTS (SELECT 1 FROM variants v WHERE v.perfume_id = p.id AND v.price <= $${paramIndex})`;
      params.push(maxPrice);
      paramIndex++;
    }

    const allowedSortColumns = ['name', 'created_at', 'price'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    params.push(limit, offset);

    const result = await query(
      `SELECT p.*, 
        json_agg(DISTINCT jsonb_build_object(
          'id', v.id,
          'size', v.size,
          'price', v.price,
          'stock_quantity', v.stock_quantity
        )) as variants,
        MIN(v.price) as min_price
       FROM perfumes p
       LEFT JOIN variants v ON p.id = v.perfume_id AND v.is_active = true
       ${whereClause}
       GROUP BY p.id
       ORDER BY ${sortColumn === 'price' ? 'min_price' : `p.${sortColumn}`} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return result.rows;
  },

  async findFeatured() {
    const result = await query(
      `SELECT p.*, 
        json_agg(json_build_object(
          'id', v.id,
          'size', v.size,
          'price', v.price,
          'stock_quantity', v.stock_quantity
        ) ORDER BY v.price) as variants
       FROM perfumes p
       LEFT JOIN variants v ON p.id = v.perfume_id AND v.is_active = true
       WHERE p.is_active = true AND p.is_featured = true
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT 6`
    );
    return result.rows;
  },

  async update(id, updates) {
    const allowedFields = ['name', 'description', 'short_description', 'gender', 'category', 'images', 'is_active', 'is_featured', 'meta_title', 'meta_description'];
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(key === 'images' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) return null;

    if (updates.name) {
      setClause.push(`slug = $${paramIndex}`);
      values.push(slugify(updates.name, { lower: true, strict: true }));
      paramIndex++;
    }

    values.push(id);
    const result = await query(
      `UPDATE perfumes SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'DELETE FROM perfumes WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  },

  // Variant operations
  async addVariant(perfumeId, variantData) {
    const { size, price, stock = 0 } = variantData;
    const perfume = await this.findById(perfumeId);
    const sku = `${perfume.slug}-${size}`.toUpperCase().replace(/\s/g, '-');

    const result = await query(
      `INSERT INTO variants (perfume_id, size, price, stock_quantity, sku)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [perfumeId, size, price, stock, sku]
    );
    return result.rows[0];
  },

  async updateVariant(variantId, updates) {
    const allowedFields = ['size', 'price', 'stock_quantity', 'is_active'];
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) return null;

    values.push(variantId);
    const result = await query(
      `UPDATE variants SET ${setClause.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async deleteVariant(variantId) {
    const result = await query(
      'DELETE FROM variants WHERE id = $1 RETURNING id',
      [variantId]
    );
    return result.rows[0];
  }
};

module.exports = PerfumeModel;
