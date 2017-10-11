import { BundleCompiler, BundleCompilationResult, CompilerDelegate, Specifier, specifierFor } from "@glimmer/bundle-compiler";
import { ComponentCapabilities, ProgramSymbolTable } from "@glimmer/interfaces";
import { CompilableTemplate, CompileOptions } from "@glimmer/opcode-compiler";
import { CompilableTemplate as ICompilableTemplate } from "@glimmer/runtime";
import { SerializedTemplateBlock } from "@glimmer/wire-format";

export function compile(templates: {}) {
  let delegate = new VisualizerCompilerDelegate(templates);
  let bundle = new BundleCompiler(delegate);

  for (let specifier in templates) {
    let [type, path] = specifier.split(':');

    let { meta, block } = templates[specifier];
    let source = meta.source;

    let bundleSpec = specifierFor(path, 'default');
    bundle.add(bundleSpec, source);
  }

  return bundle.compile();
}

const capabilities: ComponentCapabilities = {
  staticDefinitions: false,
  dynamicLayout: false,
  dynamicTag: true,
  prepareArgs: false,
  createArgs: true,
  attributeHook: true,
  elementHook: true
};

class VisualizerCompilerDelegate implements CompilerDelegate {
  constructor(private map: {}) {
  }

  hasComponentInScope(componentName: string, referrer: Specifier): boolean {
    let key = `template:/glimmer-repl/components/${componentName}`;
    return key in this.map;
  }

  resolveComponentSpecifier(componentName: string, referrer: Specifier): Specifier {
    return specifierFor(`/glimmer-repl/components/${componentName}`, 'default');
  }

  getComponentCapabilities(specifier: Specifier): ComponentCapabilities {
    return capabilities;
  }
  getComponentLayout(specifier: Specifier, block: SerializedTemplateBlock, options: CompileOptions<Specifier>): ICompilableTemplate<ProgramSymbolTable> {
    return CompilableTemplate.topLevel(block, options);
  }
  hasHelperInScope(helperName: string, referrer: Specifier): boolean {
    return helperName === 'action';
  }

  resolveHelperSpecifier(helperName: string, referrer: Specifier): Specifier {
    return specifierFor(`/glimmer-repl/helpers/${helperName}`, 'default');
  }

  hasModifierInScope(modifierName: string, referrer: Specifier): boolean {
    throw new Error("Method not implemented.");
  }
  resolveModifierSpecifier(modifierName: string, referrer: Specifier): Specifier {
    throw new Error("Method not implemented.");
  }
  hasPartialInScope(partialName: string, referrer: Specifier): boolean {
    throw new Error("Method not implemented.");
  }
  resolvePartialSpecifier(partialName: string, referrer: Specifier): Specifier {
    throw new Error("Method not implemented.");
  }
}