const PerfumeModel = require('../models/perfumeModel');

const PerfumeController = {
  async getAll(req, res, next) {
    try {
      const { gender, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;

      // Parse sort parameter
      let sortBy = 'created_at';
      let sortOrder = 'DESC';
      
      if (sort) {
        const [field, order] = sort.split(':');
        if (field && ['name', 'price', 'created_at'].includes(field)) {
          sortBy = field;
        }
        if (order && ['asc', 'desc'].includes(order.toLowerCase())) {
          sortOrder = order.toUpperCase();
        }
      }

      const filters = {
        gender,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        sortBy,
        sortOrder,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      const perfumes = await PerfumeModel.findAll(filters);

      res.json({
        perfumes: perfumes.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          shortDescription: p.short_description,
          gender: p.gender,
          images: p.images,
          variants: p.variants?.filter(v => v && v.id) || [],
          minPrice: p.min_price
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getFeatured(req, res, next) {
    try {
      const perfumes = await PerfumeModel.findFeatured();
      res.json({
        perfumes: perfumes.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          shortDescription: p.short_description,
          gender: p.gender,
          images: p.images,
          variants: p.variants?.filter(v => v && v.id) || []
        }))
      });
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const perfume = await PerfumeModel.findBySlug(slug);

      if (!perfume) {
        return res.status(404).json({ error: 'Perfume not found' });
      }

      res.json({
        perfume: {
          id: perfume.id,
          name: perfume.name,
          slug: perfume.slug,
          description: perfume.description,
          shortDescription: perfume.short_description,
          gender: perfume.gender,
          brand: perfume.brand,
          category: perfume.category,
          images: perfume.images,
          variants: perfume.variants?.filter(v => v && v.id) || [],
          metaTitle: perfume.meta_title,
          metaDescription: perfume.meta_description
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin methods
  async create(req, res, next) {
    try {
      const perfumeData = req.body;
      
      // Handle uploaded images
      if (req.files && req.files.length > 0) {
        perfumeData.images = req.files.map(file => file.path);
      }

      const perfume = await PerfumeModel.create(perfumeData);
      res.status(201).json({ message: 'Perfume created successfully', perfume });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Handle uploaded images
      if (req.files && req.files.length > 0) {
        updates.images = req.files.map(file => file.path);
      }

      const perfume = await PerfumeModel.update(id, updates);
      if (!perfume) {
        return res.status(404).json({ error: 'Perfume not found' });
      }

      res.json({ message: 'Perfume updated successfully', perfume });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await PerfumeModel.delete(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Perfume not found' });
      }

      res.json({ message: 'Perfume deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async getAllAdmin(req, res, next) {
    try {
      const perfumes = await PerfumeModel.findAll({ limit: 1000 });
      res.json({ perfumes });
    } catch (error) {
      next(error);
    }
  },

  // Variant management
  async addVariant(req, res, next) {
    try {
      const { id } = req.params;
      const variant = await PerfumeModel.addVariant(id, req.body);
      res.status(201).json({ message: 'Variant added successfully', variant });
    } catch (error) {
      next(error);
    }
  },

  async updateVariant(req, res, next) {
    try {
      const { variantId } = req.params;
      const variant = await PerfumeModel.updateVariant(variantId, req.body);
      if (!variant) {
        return res.status(404).json({ error: 'Variant not found' });
      }
      res.json({ message: 'Variant updated successfully', variant });
    } catch (error) {
      next(error);
    }
  },

  async deleteVariant(req, res, next) {
    try {
      const { variantId } = req.params;
      const result = await PerfumeModel.deleteVariant(variantId);
      if (!result) {
        return res.status(404).json({ error: 'Variant not found' });
      }
      res.json({ message: 'Variant deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = PerfumeController;
