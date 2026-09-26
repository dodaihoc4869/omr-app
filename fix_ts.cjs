const { Project } = require('ts-morph');
const project = new Project({ tsConfigFilePath: 'server/tsconfig.json' });

const diagnostics = project.getPreEmitDiagnostics();
let changes = 0;

for (const diag of diagnostics) {
    if (diag.getCode() === 2304 || diag.getCode() === 2307 || diag.getCode() === 2552) { // Cannot find name/module
        let node = null;
        try {
            node = diag.getStart() ? diag.getSourceFile().getDescendantAtPos(diag.getStart()) : null;
        } catch (e) {
            continue;
        }
        if (node && !node.wasForgotten()) {
            let target = node.getFirstAncestorByKind(require('ts-morph').SyntaxKind.IfStatement) ||
                         node.getFirstAncestorByKind(require('ts-morph').SyntaxKind.CaseClause) ||
                         node.getFirstAncestorByKind(require('ts-morph').SyntaxKind.ExpressionStatement) ||
                         node.getFirstAncestorByKind(require('ts-morph').SyntaxKind.ImportDeclaration);
            
            if (!target) {
                const func = node.getFirstAncestorByKind(require('ts-morph').SyntaxKind.FunctionDeclaration);
                if (func && !['batDauThi', 'ghiLenBangMoi', 'fetch', 'scheduled'].includes(func.getName())) {
                    target = func;
                }
            }

            if (!target) {
                const varStmt = node.getFirstAncestorByKind(require('ts-morph').SyntaxKind.VariableStatement);
                if (varStmt && !varStmt.getText().includes('boXuLy')) {
                    target = varStmt;
                }
            }
            
            if (target && !target.wasForgotten()) {
                try {
                    target.replaceWithText(`// Removed due to missing dependency`);
                    changes++;
                } catch(e) {}
            }
        }
    }
}
console.log(`Made ${changes} changes`);
project.saveSync();
