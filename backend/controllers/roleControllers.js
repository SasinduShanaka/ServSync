import Role from "../models/roleModel.js";  // Import the Role model

// ========================
// CRUD HANDLERS (Admin side)
// ========================

// GET all staff
const getAllRoles = async (req, res) => {
  try {
    const staff = await Role.find();
    if (!staff || staff.length === 0) {
      return res.status(404).json({ message: "No staff found" });
    }
    return res.status(200).json(staff);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST add staff
const addRole = async (req, res) => {
  const { nic, name, userName, role, workArea, password, status = "active", updatedBy, branch, counter } = req.body;

  try {
    const doc = new Role({
      nic, name, userName, role, workArea, password, status, updatedBy,
      branch: branch || null,
      counter: counter || null
    });
    await doc.save();
    return res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate unique field (NIC or userName)" });
    }
    return res.status(400).json({ message: "Unable to add staff" });
  }
};

// GET staff by NIC
const getById = async (req, res) => {
  try {
    const staff = await Role.findOne({ nic: req.params.id });
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    return res.status(200).json(staff);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Invalid NIC" });
  }
};

// UPDATE staff by NIC
const updateRole = async (req, res) => {
  try {
    const staff = await Role.findOne({ nic: req.params.id });
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    const fields = ["name", "userName", "role", "workArea", "password", "status", "updatedBy", "branch", "counter"];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        // If branch or counter is an empty string, set to null to avoid ObjectId cast error
        if ((f === "branch" || f === "counter") && req.body[f] === "") {
          staff[f] = null;
        } else {
          staff[f] = req.body[f];
        }
      }
    });

    await staff.save();
    return res.status(200).json(staff);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate unique field (userName)" });
    }
    return res.status(400).json({ message: "Unable to update staff" });
  }
};

// DELETE staff by NIC
const deleteRole = async (req, res) => {
  try {
    const staff = await Role.findOneAndDelete({ nic: req.params.id });
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    return res.status(200).json(staff);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Invalid NIC" });
  }
};

// ========================
// STAFF AUTH + PROFILE
// ========================

// LOGIN (accept NIC or username) and set session with branch/counter
const staffLogin = async (req, res) => {
  const { identifier, nic, userName, role, password } = req.body;
  const loginId = identifier || nic || userName; // backward compatibility
  if (!loginId || !role || !password) {
    return res.status(400).json({ message: "NIC/Username, role and password are required" });
  }

  try {
    const staff = await Role.findOne({ $or: [{ nic: loginId }, { userName: loginId }], role }).populate({ path: 'branch', select: 'name code counters' });
    if (!staff || staff.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    staff.status = "active"; // Set status to active on login
    await staff.save();

    // Derive readable names
    let branchName = null, branchCode = null, counterName = null;
    const branchId = staff.branch?._id || staff.branch || null;
    const counterId = staff.counter || null;
    if (staff.branch && typeof staff.branch === 'object') {
      branchName = staff.branch.name || null;
      branchCode = staff.branch.code || null;
      if (counterId && Array.isArray(staff.branch.counters)) {
        const c = staff.branch.counters.find(x => String(x._id) === String(counterId));
        counterName = c?.name || null;
      }
    }

    // Save session with full staff context
    req.session.staffNic = staff.nic;
    req.session.staffRole = staff.role;
    req.session.staff = {
      nic: staff.nic,
      userName: staff.userName,
      role: staff.role,
      branchId,
      branchName,
      branchCode,
      counterId,
      counterName,
      workArea: staff.workArea || null,
      name: staff.name
    };

    const redirectTo = `/dashboard/${String(staff.role).toLowerCase()}`;

    return res.status(200).json({
      message: "Login successful",
      redirectTo,
      staff: {
        nic: staff.nic,
        name: staff.name,
        userName: staff.userName,
        role: staff.role,
        workArea: staff.workArea,
        status: staff.status,
        branch: branchId,
        branchName,
        branchCode,
        counter: counterId,
        counterName
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// LOGOUT
const staffLogout = async (req, res) => {
  try {
    if (req.session.staffNic) {
      await Role.findOneAndUpdate(
        { nic: req.session.staffNic },
        { status: "inactive" },
        { new: true }
      );
    }

    delete req.session.staffNic;
    delete req.session.staffRole;

    return res.status(200).json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET current staff profile (populate branch basic info)
const getMyRole = async (req, res) => {
  if (!req.session?.staffNic) return res.status(401).json({ message: "Not logged in" });

  try {
    const staff = await Role.findOne({ nic: req.session.staffNic }).populate({ path: 'branch', select: 'name code' });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const { password, ...safe } = staff.toObject();
    return res.status(200).json(safe);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// UPDATE current staff profile
const updateMyRole = async (req, res) => {
  if (!req.session?.staffNic) return res.status(401).json({ message: "Not logged in" });

  try {
    const staff = await Role.findOne({ nic: req.session.staffNic });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const fields = ["name", "userName", "workArea", "password"];
    fields.forEach(f => {
      if (req.body[f] !== undefined) staff[f] = req.body[f];
    });

    const saved = await staff.save();
    const { password, ...safe } = saved.toObject();
    return res.status(200).json(safe);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Update failed" });
  }
};

// ========================
// EXPORTS
// ========================

export {
  getAllRoles,
  addRole,
  getById,
  updateRole,
  deleteRole,
  staffLogin,
  staffLogout,
  getMyRole,
  updateMyRole
};
