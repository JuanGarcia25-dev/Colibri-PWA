let emailTemplate = `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>{{title}}</title>
  </head>
  <body
    style="background-color: #ffffff; color: #333; margin: 0px; padding: 0px"
  >
    <div
      style="
        max-width: 600px;
        margin: auto;
        background: #ffffff;
        padding: 30px;
        border-radius: 8px;
      "
    >
    
<div style="display: flex; margin-bottom: 30px; gap: 20px">
  <img
    src="https://raw.githubusercontent.com/JuanGarcia25-dev/colibri-server/main/colibri_server/img/colibri-logo.png"
    alt="Colibri"
    style="margin: 0px auto; height: 60px"
  />
</div>

      <h2 style="margin-top: 0">{{title}}</h2>
      <p>Hola {{name}},</p>

      <p style="text-wrap: pretty;">{{message}}</p>
      {{otp_section}}
      {{cta_section}}
      <p style="text-wrap: pretty;">{{note}}</p>

      <div
        style="
          font-size: 13px;
          color: #777;
          margin-top: 30px;
          text-align: center;
        "
      >
        &mdash; El equipo de Colibri
        <br />
        <small>
          Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos en
          <a href="mailto:${process.env.MAIL_USER}" style="color: #4caf50"
            >${process.env.MAIL_USER}</a
          >
        </small>
      </div>
    </div>
  </body>
</html>
`;

const fillTemplate = (data, template = emailTemplate) => {
  const ctaSection = data.cta_link
    ? `
      <div style="display: flex; width: 100%">
        <a
          href="${data.cta_link}"
          target="_blank"
          style="
            display: inline-block;
            text-align: center;
            margin: 10px auto;
            padding: 18px 36px;
            background-color: #51d56b;
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
            border-radius: 6px;
            color: #ffffff;
          "
        >
          ${data.cta_text || "Comenzar"}
        </a>
      </div>
    `
    : "";

  return template
    .replace(/{{title}}/g, data.title || "Bienvenido a Colibri")
    .replace(/{{name}}/g, data.name || "usuario")
    .replace(
      /{{message}}/g,
      data.message ||
      "??Gracias por unirte a Colibri! Estamos emocionados de tenerte con nosotros."
    )
    .replace(/{{otp_section}}/g, data.otp_section || "")
    .replace(/{{cta_section}}/g, ctaSection)
    .replace(
      /{{note}}/g,
      data.note || "Si no solicitaste este correo, puedes ignorarlo."
    );
};

module.exports = { emailTemplate, fillTemplate };
