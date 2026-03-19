import Category from '../../models/Category.js';
import SubCategory from '../../models/SubCategory.js';

// Create Category
export const createCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;

    const category = await Category.create({ name, slug });

    res.status(201).json({
      message: 'Category created',
      category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Categories
export const getCategories = async (req, res) => {
  try {
    const data = await Category.find().sort({ createdAt: -1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete all related subcategories
    await SubCategory.deleteMany({ category: id });

    // Delete category
    await Category.findByIdAndDelete(id);

    res.json({
      message: 'Category and related subcategories deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
