import User from "../models/userModel.js";


// user login/logout/session


const userLogin = async (req, res) => {
  const { nicOrPassport, password } = req.body;
  if (!nicOrPassport || !password) {
    return res.status(400).json({ message: "NIC and password required" });
  }
  try {
    const user = await User.findOne({ nicOrPassport });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid NIC or password" });
    }
  req.session.nic = user.nicOrPassport;
  // Set status to active on login
  user.status = 'active';
  // Record login timestamp for analytics
  if (!Array.isArray(user.loginTimestamps)) user.loginTimestamps = [];
  user.loginTimestamps.push(new Date());
  await user.save();
  const { password: _, ...safe } = user.toObject();
  res.json({ message: "Login success", user: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const userLogout = (req, res) => {
  // Set status to inactive on logout
  if (req.session.nic) {
    User.findOneAndUpdate({ nicOrPassport: req.session.nic }, { status: 'inactive' }).then(() => {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out" });
      });
    });
  } else {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  }
};

const getCurrentUser = async (req, res) => {
  if (!req.session.nic) return res.status(401).json({ message: "Not logged in" });
  try {
    const user = await User.findOne({ nicOrPassport: req.session.nic });
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password, ...safe } = user.toObject();
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// CRUD HANDLERS (admin side)


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (!users) return res.status(404).json({ message: "No users found" });
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const addUsers = async (req, res) => {
  const {
    fullName, nicOrPassport, dateOfBirth, gender,
    address, mobile, email, insuranceType,
    username, password
  } = req.body;

  try {
    const userDoc = new User({
      fullName, nicOrPassport, dateOfBirth, gender,
      address, mobile, email, insuranceType,
      username, password
    });
    await userDoc.save();
    res.status(201).json(userDoc);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      // Extract duplicated field from error
      const duplicateField = err.keyValue ? Object.keys(err.keyValue)[0] : null;
      const duplicateValue = err.keyValue ? err.keyValue[duplicateField] : null;
      let message = "Duplicate unique field";
      if (duplicateField && duplicateValue) {
        message = `Duplicate value for field '${duplicateField}': '${duplicateValue}'`;
      }
      return res.status(409).json({ message });
    }
    res.status(400).json({ message: "Unable to add user" });
  }
};

const getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid user ID" });
  }
};

const updateUser = async (req, res) => {
  try {
    const userDoc = await User.findById(req.params.id);
    if (!userDoc) return res.status(404).json({ message: "User not found" });

    const fields = [
      "fullName", "nicOrPassport", "dateOfBirth", "gender", "address",
      "mobile", "email", "insuranceType", "username", "password"
    ];
    fields.forEach(f => {
      if (req.body[f] !== undefined) userDoc[f] = req.body[f];
    });

    await userDoc.save();
    res.status(200).json(userDoc);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) return res.status(409).json({ message: "Duplicate unique field" });
    // Extract duplicated field from error
    const duplicateField = err.keyValue ? Object.keys(err.keyValue)[0] : null;
    const duplicateValue = err.keyValue ? err.keyValue[duplicateField] : null;
    let message = "Duplicate unique field";
    if (duplicateField && duplicateValue) {
      message = `Duplicate value for field '${duplicateField}': '${duplicateValue}'`;
    }
    return res.status(409).json({ message });
    res.status(400).json({ message: "Unable to update user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid user ID" });
  }
};


// PROFILE HANDLERS (user side)


const getMyProfile = async (req, res) => {
  if (!req.session.nic) return res.status(401).json({ message: "Not logged in" });
  try {
    const user = await User.findOne({ nicOrPassport: req.session.nic });
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password, ...safe } = user.toObject();
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateMyProfile = async (req, res) => {
  if (!req.session.nic) return res.status(401).json({ message: "Not logged in" });
  try {
    const user = await User.findOne({ nicOrPassport: req.session.nic });
    if (!user) return res.status(404).json({ message: "User not found" });

    const fields = [
      "fullName", "dateOfBirth", "gender", "address",
      "mobile", "email", "insuranceType", "username", "password"
    ];
    fields.forEach(f => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });

    const saved = await user.save();
    const { password, ...safe } = saved.toObject();
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Update failed" });
  }
};

// ========================
// EXPORTS
// ========================

export {
  userLogin,
  userLogout,
  getCurrentUser,
  getAllUsers,
  addUsers,
  getById,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile
};
