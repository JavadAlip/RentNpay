import jwt from 'jsonwebtoken';

export const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    console.log('ENV EMAIL:', `"${process.env.ADMIN_EMAIL}"`);
    console.log('ENV PASSWORD:', `"${process.env.ADMIN_PASSWORD}"`);
    console.log('BODY:', `"${identifier}"`, `"${password}"`);

    // ✅ Validation
    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Email and password required',
      });
    }

    // ✅ Simple ENV check
    if (
      identifier !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        message: 'Invalid admin credentials',
      });
    }

    // ✅ Generate token
    const token = jwt.sign(
      { role: 'admin', email: identifier },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );

    return res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        email: identifier,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const adminLogout = async (req, res) => {
  try {
    console.log(' Admin Logout API Hit');

    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    return res.status(200).json({
      message: 'Admin logged out successfully',
    });
  } catch (error) {
    console.error(' Admin logout error:', error);

    res.status(500).json({
      message: 'Server error',
    });
  }
};
