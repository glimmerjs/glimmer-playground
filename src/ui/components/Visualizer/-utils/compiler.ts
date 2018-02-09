import { BundleCompiler, BundleCompilationResult, CompilerDelegate } from "@glimmer/bundle-compiler";
import { ComponentCapabilities, ProgramSymbolTable, ModuleLocator, Opaque } from "@glimmer/interfaces";
import { CompilableTemplate, CompileOptions } from "@glimmer/opcode-compiler";
import { CompilableTemplate as ICompilableTemplate } from "@glimmer/runtime";
import { SerializedTemplateBlock } from "@glimmer/wire-format";

export function compile(templates: {}, helpers: {}) {
  let delegate = new VisualizerCompilerDelegate(templates, helpers);
  let bundle = new BundleCompiler(delegate);

  for (let specifier in templates) {
    let [type, path] = specifier.split(':');

    let { meta, block } = templates[specifier];
    let source = meta.source;

    let locator = { name: 'default', module: path };
    bundle.add(locator, source);
  }

  return bundle.compile();
}

const capabilities: ComponentCapabilities = {
  dynamicLayout: false,
  dynamicTag: true,
  prepareArgs: false,
  createArgs: true,
  attributeHook: true,
  elementHook: true
};

class VisualizerCompilerDelegate implements CompilerDelegate<Opaque> {
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
    return capabilities;
  }

  getComponentLayout(specifier: ModuleLocator, block: SerializedTemplateBlock, options: CompileOptions<ModuleLocator>): ICompilableTemplate<ProgramSymbolTable> {
    return CompilableTemplate.topLevel(block, options);
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
