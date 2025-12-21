/** @type {import('jest').Config} */
export default {
    // Usar jsdom para simular el navegador
    testEnvironment: 'jsdom',

    // Buscar tests en __tests__
    testMatch: ['**/__tests__/**/*.test.js'],

    // Extensiones de módulos
    moduleFileExtensions: ['js'],

    // Archivo de setup global
    setupFilesAfterEnv: ['./__tests__/setup.js'],

    // Verbose output
    verbose: true,

    // Coverage
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/main.js',
        '!src/config/**'
    ]
};
