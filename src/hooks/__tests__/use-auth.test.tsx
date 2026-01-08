import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuth } from "../use-auth";
import * as actions from "@/actions";
import * as anonWorkTracker from "@/lib/anon-work-tracker";
import * as getProjectsAction from "@/actions/get-projects";
import * as createProjectAction from "@/actions/create-project";
import { useRouter } from "next/navigation";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

describe("useAuth", () => {
  const mockPush = vi.fn();
  const mockRouter = {
    push: mockPush,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn", () => {
    test("successfully signs in and navigates to project with anonymous work", async () => {
      const mockAnonWork = {
        messages: [{ id: "1", role: "user", content: "Hello" }],
        fileSystemData: { "/": { type: "directory" } },
      };

      const mockProject = {
        id: "project-123",
        name: "Design from 12:30:00 PM",
      };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonWorkTracker.getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (createProjectAction.createProject as any).mockResolvedValue(
        mockProject
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      const authResult = await signInPromise!;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(actions.signIn).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
      expect(anonWorkTracker.getAnonWorkData).toHaveBeenCalled();
      expect(createProjectAction.createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: mockAnonWork.messages,
        data: mockAnonWork.fileSystemData,
      });
      expect(anonWorkTracker.clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-123");
      expect(authResult).toEqual({ success: true });
    });

    test("successfully signs in and navigates to most recent project when no anonymous work", async () => {
      const mockProjects = [
        { id: "project-456", name: "My Project", createdAt: new Date(), updatedAt: new Date() },
        { id: "project-789", name: "Old Project", createdAt: new Date(), updatedAt: new Date() },
      ];

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonWorkTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjectsAction.getProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      await signInPromise!;

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/project-456");
      });

      expect(getProjectsAction.getProjects).toHaveBeenCalled();
      expect(anonWorkTracker.clearAnonWork).not.toHaveBeenCalled();
    });

    test("successfully signs in and creates new project when no projects exist", async () => {
      const mockNewProject = {
        id: "project-new",
        name: "New Design #12345",
      };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonWorkTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjectsAction.getProjects as any).mockResolvedValue([]);
      (createProjectAction.createProject as any).mockResolvedValue(
        mockNewProject
      );

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      await signInPromise!;

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/project-new");
      });

      expect(createProjectAction.createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/New Design #\d+/),
        messages: [],
        data: {},
      });
    });

    test("handles sign in failure without navigation", async () => {
      const errorResult = { success: false, error: "Invalid credentials" };

      (actions.signIn as any).mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "wrongpass");
      });

      const authResult = await signInPromise!;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(authResult).toEqual(errorResult);
      expect(mockPush).not.toHaveBeenCalled();
      expect(anonWorkTracker.getAnonWorkData).not.toHaveBeenCalled();
    });

    test("sets isLoading to false even if post-signin navigation fails", async () => {
      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonWorkTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjectsAction.getProjects as any).mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      await expect(signInPromise!).rejects.toThrow("Network error");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("signUp", () => {
    test("successfully signs up and navigates to project with anonymous work", async () => {
      const mockAnonWork = {
        messages: [
          { id: "1", role: "user", content: "Create a button" },
          { id: "2", role: "assistant", content: "Here's your button" },
        ],
        fileSystemData: {
          "/": { type: "directory" },
          "/App.tsx": { type: "file", content: "export default function App() {}" },
        },
      };

      const mockProject = {
        id: "project-abc",
        name: "Design from 3:45:00 PM",
      };

      (actions.signUp as any).mockResolvedValue({ success: true });
      (anonWorkTracker.getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (createProjectAction.createProject as any).mockResolvedValue(
        mockProject
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("new@example.com", "newpassword123");
      });

      expect(result.current.isLoading).toBe(true);

      const authResult = await signUpPromise!;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(actions.signUp).toHaveBeenCalledWith(
        "new@example.com",
        "newpassword123"
      );
      expect(anonWorkTracker.getAnonWorkData).toHaveBeenCalled();
      expect(createProjectAction.createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: mockAnonWork.messages,
        data: mockAnonWork.fileSystemData,
      });
      expect(anonWorkTracker.clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-abc");
      expect(authResult).toEqual({ success: true });
    });

    test("successfully signs up and navigates to most recent project when no anonymous work", async () => {
      const mockProjects = [
        { id: "project-latest", name: "Latest Project", createdAt: new Date(), updatedAt: new Date() },
      ];

      (actions.signUp as any).mockResolvedValue({ success: true });
      (anonWorkTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjectsAction.getProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("new@example.com", "newpassword123");
      });

      await signUpPromise!;

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/project-latest");
      });

      expect(getProjectsAction.getProjects).toHaveBeenCalled();
    });

    test("successfully signs up and creates new project when no projects exist", async () => {
      const mockNewProject = {
        id: "project-first",
        name: "New Design #98765",
      };

      (actions.signUp as any).mockResolvedValue({ success: true });
      (anonWorkTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjectsAction.getProjects as any).mockResolvedValue([]);
      (createProjectAction.createProject as any).mockResolvedValue(
        mockNewProject
      );

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("new@example.com", "newpassword123");
      });

      await signUpPromise!;

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/project-first");
      });

      expect(createProjectAction.createProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/New Design #\d+/),
        messages: [],
        data: {},
      });
    });

    test("handles sign up failure without navigation", async () => {
      const errorResult = {
        success: false,
        error: "Email already registered",
      };

      (actions.signUp as any).mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("existing@example.com", "password123");
      });

      const authResult = await signUpPromise!;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(authResult).toEqual(errorResult);
      expect(mockPush).not.toHaveBeenCalled();
      expect(anonWorkTracker.getAnonWorkData).not.toHaveBeenCalled();
    });

    test("sets isLoading to false even if post-signup navigation fails", async () => {
      (actions.signUp as any).mockResolvedValue({ success: true });
      (anonWorkTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjectsAction.getProjects as any).mockRejectedValue(
        new Error("Database error")
      );

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("new@example.com", "password123");
      });

      await expect(signUpPromise!).rejects.toThrow("Database error");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("isLoading state", () => {
    test("starts as false", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("becomes true during signIn and returns to false after", async () => {
      (actions.signIn as any).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password");
      });

      expect(result.current.isLoading).toBe(true);

      await signInPromise!;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    test("becomes true during signUp and returns to false after", async () => {
      (actions.signUp as any).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("test@example.com", "password");
      });

      expect(result.current.isLoading).toBe(true);

      await signUpPromise!;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("edge cases", () => {
    test("handles anonymous work with empty messages array", async () => {
      const mockAnonWork = {
        messages: [],
        fileSystemData: { "/": { type: "directory" } },
      };

      const mockProjects = [
        { id: "project-existing", name: "Existing", createdAt: new Date(), updatedAt: new Date() },
      ];

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonWorkTracker.getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (getProjectsAction.getProjects as any).mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password");
      });

      await signInPromise!;

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/project-existing");
      });

      // Should not create project with anonymous work because messages array is empty
      expect(createProjectAction.createProject).not.toHaveBeenCalled();
      expect(anonWorkTracker.clearAnonWork).not.toHaveBeenCalled();
    });

    test("handles anonymous work with null fileSystemData", async () => {
      const mockAnonWork = {
        messages: [{ id: "1", role: "user", content: "Hello" }],
        fileSystemData: null,
      };

      const mockProject = {
        id: "project-anon",
        name: "Design from 4:30:00 PM",
      };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonWorkTracker.getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (createProjectAction.createProject as any).mockResolvedValue(
        mockProject
      );

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password");
      });

      await signInPromise!;

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/project-anon");
      });

      expect(createProjectAction.createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: mockAnonWork.messages,
        data: null,
      });
    });

    test("returns correct API from hook", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signUp");
      expect(result.current).toHaveProperty("isLoading");
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });
});