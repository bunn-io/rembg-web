#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
    version: string;
}

// Read package.json to get version
const packageJson: PackageJson = JSON.parse(
    fs.readFileSync('package.json', 'utf8')
);
const version = packageJson.version;

// Template processor function
function processTemplate(
    templatePath: string,
    outputPath: string,
    variables: Record<string, string> = {}
): void {
    let template = fs.readFileSync(templatePath, 'utf8');

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, template);
}

// Process base template with content
function processPageTemplate(
    contentTemplate: string,
    outputPath: string,
    title: string
): void {
    const baseTemplate = 'docs-site/templates/base.html';
    const content = fs.readFileSync(contentTemplate, 'utf8');

    processTemplate(baseTemplate, outputPath, {
        title,
        content,
    });
}

// Create guides directory
if (!fs.existsSync('docs-site/guides')) {
    fs.mkdirSync('docs-site/guides', { recursive: true });
}

// Generate guide pages
processPageTemplate(
    'docs-site/templates/installation.html',
    'docs-site/guides/installation.html',
    'Installation Guide'
);
processPageTemplate(
    'docs-site/templates/models.html',
    'docs-site/guides/models.html',
    'Models Guide'
);

console.log(`Documentation built successfully with version ${version}`);
