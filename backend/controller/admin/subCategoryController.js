import SubCategory from '../../models/SubCategory.js';

// Create SubCategory
export const createSubCategory = async (req, res) => {
  try {
    const { name, categoryId } = req.body;

    const subCategory = await SubCategory.create({
      name,
      category: categoryId,
    });

    res.status(201).json({
      message: 'SubCategory created',
      subCategory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get SubCategory by Category
export const getSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const data = await SubCategory.find({
      category: categoryId,
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategory = await SubCategory.findById(id);

    if (!subCategory) {
      return res.status(404).json({ message: 'SubCategory not found' });
    }

    await SubCategory.findByIdAndDelete(id);

    res.json({
      message: 'SubCategory deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
