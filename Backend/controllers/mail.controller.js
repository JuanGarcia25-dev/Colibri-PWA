const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { sendMail } = require("../services/mail.service");
let { fillTemplate } = require("../templates/mail.template");

const riderModel = require("../models/rider.model");
const userModel = require("../models/user.model");
const adminModel = require("../models/admin.model");

const getModelByUserType = (userType) => {
  if (userType === "user") return userModel;
  if (userType === "rider") return riderModel;
  if (userType === "admin") return adminModel;
  return null;
};

// Envio de correo de verificacion
module.exports.sendVerificationEmail = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  let user;
  if (req.userType === "user") {
    const userId = req.user?._id || req.user?.id;
    user = userId ? await userModel.findById(userId) : null;
  } else if (req.userType === "rider") {
    const riderId = req.rider?._id || req.rider?.id;
    user = riderId ? await riderModel.findById(riderId) : null;
  } else {
    return res.status(400).json({
      message:
        "El enlace de verificacion de correo no es valido debido a un tipo de usuario incorrecto",
    });
  }

  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  if (user.emailVerified) {
    return res.status(400).json({
      message:
        "Tu correo ya ha sido verificado. Puedes continuar usando la aplicacion.",
    });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  user.emailOtpHash = otpHash;
  user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  try {
    const otpSection = `
      <div style="margin: 18px 0; text-align: center;">
        <div style="font-size: 14px; color: #666; margin-bottom: 6px;">Tu codigo de verificacion:</div>
        <div style="font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #111;">${otp}</div>
      </div>
    `;

    let mailHtml = fillTemplate({
      title: "Verificacion de correo requerida",
      name: user.fullname.firstname,
      message:
        "Gracias por registrarte en Colibri. Para completar tu registro y activar tu cuenta, ingresa el codigo a continuacion dentro de la app.",
      otp_section: otpSection,
      note:
        "Por tu seguridad, este codigo es valido solo por <strong>10 minutos</strong>. Si expira, puedes solicitar uno nuevo desde la app. <br/>Si no creaste una cuenta en Colibri, ignora este correo.",
    });

    const result = await sendMail(
      user.email,
      "Colibri - Verificacion de correo",
      mailHtml
    );

    return res.status(200).json({
      message: "Correo de verificacion enviado con exito",
      user: {
        email: user.email,
        fullname: user.fullname,
      },
    });
  } catch (error) {
    console.error("Error al enviar el correo de verificacion:", error);
    return res
      .status(500)
      .json({ message: "No se pudo enviar el correo de verificacion" });
  }
});

// Recuperacion de contrasena
module.exports.forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { email } = req.body;
  const { userType } = req.params;
  const normalizedEmail = email?.trim().toLowerCase();
  const Model = getModelByUserType(userType);

  if (!Model) {
    return res.status(400).json({ message: "Tipo de usuario invalido" });
  }

  const user = await Model.findOne({ email: normalizedEmail }).select(
    "+resetOtpHash +resetOtpExpires"
  );
  if (!user)
    return res.status(404).json({
      message:
        "Usuario no encontrado. Por favor verifica tus credenciales e intentalo de nuevo",
    });

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  user.resetOtpHash = otpHash;
  user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  const otpSection = `
    <div style="margin: 18px 0; text-align: center;">
      <div style="font-size: 14px; color: #666; margin-bottom: 6px;">Tu codigo de recuperacion:</div>
      <div style="font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #111;">${otp}</div>
    </div>
  `;

  let mailHtml = fillTemplate({
    title: "Restablecer contrasena",
    name: user.fullname.firstname,
    message:
      "Recibimos una solicitud para restablecer la contrasena de tu cuenta en Colibri. Si realizaste esta solicitud, ingresa el siguiente codigo dentro de la app para continuar.",
    otp_section: otpSection,
    note:
      "Si no solicitaste un restablecimiento de contrasena, puedes ignorar este correo de forma segura. Tu contrasena actual permanecera igual. <br/>Este codigo es valido solo por <strong>10 minutos</strong>.",
  });

  await sendMail(user.email, "Colibri - Restablecer contrasena", mailHtml);

  res.status(200).json({
    message: "Codigo de restablecimiento enviado con exito",
    email: user.email,
  });
});

// Restablecer contrasena
module.exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json(errors.array());

  const { token, password } = req.body;
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(400).json({ message: "Token invalido o expirado" });
  }

  const user = await userModel.findById(payload.id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  user.password = await userModel.hashPassword(password);
  await user.save();

  res.status(200).json({ message: "Contrasena restablecida con exito" });
});
