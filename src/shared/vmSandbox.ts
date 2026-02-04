export interface VmSandboxOptions {
  consoleImpl?: any;
}

/**
 * Creates a basic CommonJS-style sandbox suitable for use with node:vm.
 * It provides `module`, `exports`, and a configurable `console`.
 */
export function createCommonJsSandbox(options: VmSandboxOptions = {}): any {
  const sandbox: any = {
    module: { exports: {} },
    exports: {},
    console: options.consoleImpl ?? console,
  };

  return sandbox;
}
