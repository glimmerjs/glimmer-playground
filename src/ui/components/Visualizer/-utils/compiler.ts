import { CAPABILITIES } from "@glimmer/component";
import { BundleCompiler, BundleCompilationResult, CompilerDelegate } from "@glimmer/bundle-compiler";
import { ComponentCapabilities, ProgramSymbolTable, ModuleLocator } from "@glimmer/interfaces";
import { CompilableTemplate, CompileOptions } from "@glimmer/opcode-compiler";
import { SerializedTemplateBlock } from "@glimmer/wire-format";

export function compile(templates: {}, helpers: {}) {
  let delegate = new VisualizerCompilerDelegate(templates, helpers);
  let bundle = new BundleCompiler(delegate);

  for (let specifier in templates) {
    let [type, path] = specifier.split(':');

    let { meta, block } = templates[specifier];
    let source = meta.source;

    let locator = { name: 'default', module: path };
    bundle.addTemplateSource(locator, source);
  }

  return bundle.compile();
}


class VisualizerCompilerDelegate implements CompilerDelegate<unknown> {
  constructor(private templates: {}, private helpers: {}) {
  }

  hasComponentInScope(componentName: string, referrer: ModuleLocator): boolean {
    let key = `template:/glimmer-repl/components/${componentName}`;
    return key in this.templates;
  }

  resolveComponent(componentName: string, referrer: ModuleLocator): ModuleLocator {
    return { module: `/glimmer-repl/components/${componentName}`, name: 'default' };
  }

  getComponentCapabilities(specifier: ModuleLocator): ComponentCapabilities {
    return CAPABILITIES;
  }

  hasHelperInScope(helperName: string, referrer: ModuleLocator): boolean {
    if (helperName === 'action' || helperName === 'if') {
      return true;
    }

    let key = `helper:/glimmer-repl/components/${helperName}`;
    return key in this.helpers;
  }

  resolveHelper(helperName: string, referrer: ModuleLocator): ModuleLocator {
    return { module: `/glimmer-repl/helpers/${helperName}`, name: 'default' };
  }

  hasModifierInScope(modifierName: string, referrer: ModuleLocator): boolean {
    throw new Error("Method not implemented.");
  }

  resolveModifier(modifierName: string, referrer: ModuleLocator): ModuleLocator {
    throw new Error("Method not implemented.");
  }

  hasPartialInScope(partialName: string, referrer: ModuleLocator): boolean {
    throw new Error("Method not implemented.");
  }

  resolvePartial(partialName: string, referrer: ModuleLocator): ModuleLocator {
    throw new Error("Method not implemented.");
  }
}
