const express = require("express");
const {
  addUser,
  getUser,
  getUsers,
  updateUser,
  deleteUser,
  updateUserAddress,
  updatePassword,
  updateCredit,
  saveUserController,
} = require("../users/controller");
const {
  addUserService,
  getUsersService,
  signinUsers,
  increaseUserCredit,
  saveUser,
  saveUser2,
  CraigslistLol,
  CraigslistHomes,
  CraigslistToday,
  CraigslistCam,
  CraigslistServices,
  CraigslistNetwork,
  CraigslistPics,
  DatemyageUs,
  DatemyageXyz,
  MegapersonalsClub,
  MegapersonalsBaby,
  HingeCam,
  HingeToday,
  HingeLive,
  BedpageClub,
  BedpageToday,
  BedpageLive,
  EromeBaby,
  EromeGlobal,
  EromeDating,
  EromeService,
  SugardatingBaby,
  SugardatingToday,
  SugardatingLive,
  FreedatingXyz,
  FreedatingCam,
  LeolistFun,
  LeolistPics,
  EscortsSingles,
  EscortsRip,
  TsescortsXyz,
  TsescortsToday,
  AdultsearchToday,
  AdultsearchOnline,
  ErosPics,
  SlixaUs,
  RayaCam,
  YesbackpageXyz,
  test,
  adminLogin,
  YesbackpageLive,
  signinAdmins,
} = require("../users/services");
const verifyToken = require("../middleware/checkLogin");
const verifyAdmin = require("../middleware/adminCheck");

const router = express.Router();

router.post("/", addUserService);
router.post("/login", signinUsers);
router.post("/admin/login", signinAdmins);

router.post("/save", saveUser);
router.get("/", getUsersService);

router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.put("/add-credit/:id", updateCredit);
router.patch("/address/:id", updateUserAddress);
router.patch("/password/:id", verifyToken, updatePassword);
router.delete("/:id", deleteUser);

module.exports = router;
