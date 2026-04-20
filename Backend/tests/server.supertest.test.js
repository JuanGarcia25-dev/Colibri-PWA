const express = require("express");
const request = require("supertest");

let capturedApp;
const mockListen = jest.fn((port, callback) => {
  if (callback) callback();
  return { close: jest.fn() };
});

jest.mock("http", () => {
  const actual = jest.requireActual("http");
  return {
    ...actual,
    createServer: jest.fn((app) => {
      capturedApp = app;
      return {
        listen: mockListen,
      };
    }),
  };
});

jest.mock("../socket", () => ({
  initializeSocket: jest.fn(),
}));

jest.mock("../config/db", () => ({}));
jest.mock("../services/active.service", () => jest.fn());
jest.mock("../services/logging.service", () => ({
  write: jest.fn(),
}));

jest.mock("../routes/auth.routes", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/health", (req, res) => res.status(200).json({ ok: true }));
  return router;
});
jest.mock("../routes/admin.routes", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/health", (req, res) => res.status(200).json({ ok: true }));
  return router;
});
jest.mock("../routes/driver.routes", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/health", (req, res) => res.status(200).json({ ok: true }));
  return router;
});
jest.mock("../routes/user.routes", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/health", (req, res) => res.status(200).json({ ok: true }));
  return router;
});
jest.mock("../routes/rider.routes", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/health", (req, res) => res.status(200).json({ ok: true }));
  return router;
});
jest.mock("../routes/maps.routes", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/health", (req, res) => res.status(200).json({ ok: true }));
  return router;
});
jest.mock("../routes/ride.routes", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/health", (req, res) => res.status(200).json({ ok: true }));
  return router;
});
jest.mock("../routes/mail.routes", () => {
  const express = require("express");
  const router = express.Router();
  router.get("/health", (req, res) => res.status(200).json({ ok: true }));
  return router;
});

describe("Backend server", () => {
  beforeAll(() => {
    require("../server");
  });

  it("responde GET /reload con el mensaje de recarga", async () => {
    const response = await request(capturedApp).get("/reload");

    expect(response.status).toBe(200);
    expect(response.body).toBe("Server Reloaded");
  });

  it("sirve index.html para rutas no API", async () => {
    const response = await request(capturedApp).get("/ruta-que-no-existe");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/html/);
  });

  it("inicia el servidor una sola vez", () => {
    expect(mockListen).toHaveBeenCalledTimes(1);
  });
});
