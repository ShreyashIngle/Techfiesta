import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, location, phone, landArea } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, location, phone, landArea },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    // Note: In a production environment, implement proper file upload
    // For now, we'll just update with a URL
    const avatarUrl = req.body.avatarUrl || 'https://example.com/default-avatar.png';
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');
    
    res.json({ avatarUrl: user.avatar });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading avatar' });
  }
};


export const updateNotifications = async (req, res) => {
  try {
    const { notifications } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { notifications },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications' });
  }
};