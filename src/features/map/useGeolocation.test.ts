import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGeolocation } from "./useGeolocation";

// Mock-type for watchPosition callback
type SuccessCallback = (pos: GeolocationPosition) => void;
type ErrorCallback = (err: GeolocationPositionError) => void;

const mockClearWatch = vi.fn();
let mockWatchPosition: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.restoreAllMocks();
  mockClearWatch.mockClear();
  mockWatchPosition = vi.fn().mockReturnValue(42);

  Object.defineProperty(navigator, "geolocation", {
    value: {
      watchPosition: mockWatchPosition,
      clearWatch: mockClearWatch,
    },
    writable: true,
    configurable: true,
  });
});

describe("useGeolocation", () => {
  it("starter med loading=true og position=null", () => {
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.loading).toBe(true);
    expect(result.current.position).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("kaldar watchPosition med enableHighAccuracy", () => {
    renderHook(() => useGeolocation());

    expect(mockWatchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true }),
    );
  });

  it("setur position við success callback", () => {
    const { result } = renderHook(() => useGeolocation());

    const successCallback = mockWatchPosition.mock
      .calls[0][0] as SuccessCallback;

    act(() => {
      successCallback({
        coords: {
          latitude: 62.0,
          longitude: -6.8,
          accuracy: 10,
          heading: 180,
          speed: 1.5,
          altitude: null,
          altitudeAccuracy: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.position).toEqual({
      latitude: 62.0,
      longitude: -6.8,
      accuracy: 10,
      heading: 180,
      speed: 1.5,
    });
  });

  it("setur feilmelding á føroyskum við PERMISSION_DENIED", () => {
    const { result } = renderHook(() => useGeolocation());

    const errorCallback = mockWatchPosition.mock
      .calls[0][1] as ErrorCallback;

    act(() => {
      errorCallback({
        code: 1, // PERMISSION_DENIED
        message: "User denied",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain("GPS-loyvi");
    expect(result.current.position).toBeNull();
  });

  it("clearar watch við unmount", () => {
    const { unmount } = renderHook(() => useGeolocation());

    unmount();

    expect(mockClearWatch).toHaveBeenCalledWith(42);
  });

  it("setur feilmelding um geolocation ikki er tøkt", () => {
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain("ikki tøkt");
  });
});
