module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/no-unknown-property': ['error', { 
      ignore: ['args', 'position', 'rotation', 'scale', 'attach', 'geometry', 'material', 'color', 
               'intensity', 'castShadow', 'receiveShadow', 'transparent', 'opacity', 'wireframe',
               'emissive', 'emissiveIntensity', 'metalness', 'roughness', 'count', 'array', 'itemSize',
               'sizeAttenuation', 'object', 'map', 'alphaTest', 'depthWrite', 'blending']
    }],
  },
}