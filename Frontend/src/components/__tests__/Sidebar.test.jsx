import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../Sidebar";

const mockNavigate = jest.fn();

jest.mock("axios");

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Sidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.get.mockResolvedValue({
      status: 200,
      data: {
        user: {
          email: "ana@colibri.com",
          driverStatus: "none",
          fullname: {
            firstname: "Ana",
            lastname: "Lopez",
          },
        },
      },
    });

    localStorage.setItem("token", "user-token");
    localStorage.setItem(
      "userData",
      JSON.stringify({
        type: "user",
        data: {
          email: "ana@colibri.com",
          driverStatus: "none",
          fullname: {
            firstname: "Ana",
            lastname: "Lopez",
          },
        },
      })
    );
    localStorage.setItem(
      "linkedRoles",
      JSON.stringify({
        tokens: {
          user: "user-token",
          rider: "rider-token",
        },
        data: {
          user: {
            email: "ana@colibri.com",
            fullname: {
              firstname: "Ana",
              lastname: "Lopez",
            },
          },
          rider: {
            email: "ana@colibri.com",
            fullname: {
              firstname: "Ana",
              lastname: "Lopez",
            },
          },
        },
      })
    );
  });

  it("muestra la informacion del usuario al abrir el sidebar", async () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    fireEvent.click(
      container.querySelector('div[class*="absolute"][class*="right-0"][class*="top-0"]')
    );

    expect(await screen.findByText("Ana Lopez")).toBeInTheDocument();
    expect(screen.getByText("ana@colibri.com")).toBeInTheDocument();
    expect(screen.getByText("Cambiar a Conductor")).toBeInTheDocument();
  });

  it("permite cambiar de usuario a conductor cuando existen roles vinculados", async () => {
    const { container } = render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    fireEvent.click(
      container.querySelector('div[class*="absolute"][class*="right-0"][class*="top-0"]')
    );

    fireEvent.click(await screen.findByRole("button", { name: /cambiar a conductor/i }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("rider-token");
      expect(mockNavigate).toHaveBeenCalledWith("/rider/home");
    });
  });
});
