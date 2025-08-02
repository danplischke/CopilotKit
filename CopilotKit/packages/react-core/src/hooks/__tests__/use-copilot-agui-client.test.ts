import { renderHook } from '@testing-library/react';
import { useCopilotAguiClient } from '../use-copilot-agui-client';

// Mock the dependencies
jest.mock('../../components/toast/toast-provider', () => ({
  useToast: () => ({
    setBannerError: jest.fn(),
  }),
}));

jest.mock('@ag-ui/client', () => ({
  HttpAgent: jest.fn().mockImplementation(() => ({
    runAgent: jest.fn(),
    abortRun: jest.fn(),
  })),
}));

jest.mock('../../utils/dev-console', () => ({
  shouldShowDevConsole: jest.fn(() => false),
}));

describe('useCopilotAguiClient', () => {
  it('should create ag_ui client when enabled', () => {
    const { result } = renderHook(() =>
      useCopilotAguiClient({
        url: 'http://localhost:8000',
        enabled: true,
      })
    );

    expect(result.current.aguiClient).toBeDefined();
    expect(result.current.errorSubscriber).toBeDefined();
  });

  it('should not create ag_ui client when disabled', () => {
    const { result } = renderHook(() =>
      useCopilotAguiClient({
        url: 'http://localhost:8000',
        enabled: false,
      })
    );

    expect(result.current.aguiClient).toBeNull();
  });

  it('should not create ag_ui client when url is empty', () => {
    const { result } = renderHook(() =>
      useCopilotAguiClient({
        url: '',
        enabled: true,
      })
    );

    expect(result.current.aguiClient).toBeNull();
  });
});