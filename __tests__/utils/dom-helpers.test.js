/**
 * Tests para src/utils/dom-helpers.js
 * Funciones de manipulación segura del DOM
 */

import {
    getElement,
    setInputValue,
    getInputValue,
    setElementHTML,
    addElementClass,
    removeElementClass
} from '../../src/utils/dom-helpers.js';

describe('DOM Helpers - getElement', () => {

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
      <div id="test-div">Test Content</div>
      <input id="test-input" value="test value" />
    `;
    });

    test('getElement retorna elemento existente', () => {
        const element = getElement('test-div');
        expect(element).not.toBeNull();
        expect(element.textContent).toBe('Test Content');
    });

    test('getElement retorna null para elemento inexistente', () => {
        const element = getElement('non-existent');
        expect(element).toBeNull();
    });

});

describe('DOM Helpers - setInputValue', () => {

    beforeEach(() => {
        document.body.innerHTML = `<input id="my-input" value="" />`;
    });

    test('setInputValue establece valor en input', () => {
        setInputValue('my-input', 'nuevo valor');
        const input = document.getElementById('my-input');
        expect(input.value).toBe('nuevo valor');
    });

    test('setInputValue no crashea con elemento inexistente', () => {
        expect(() => {
            setInputValue('no-existe', 'valor');
        }).not.toThrow();
    });

});

describe('DOM Helpers - getInputValue', () => {

    beforeEach(() => {
        document.body.innerHTML = `<input id="my-input" value="valor inicial" />`;
    });

    test('getInputValue obtiene valor de input', () => {
        const valor = getInputValue('my-input');
        expect(valor).toBe('valor inicial');
    });

    test('getInputValue retorna string vacío para elemento inexistente', () => {
        const valor = getInputValue('no-existe');
        expect(valor).toBe('');
    });

});

describe('DOM Helpers - setElementHTML', () => {

    beforeEach(() => {
        document.body.innerHTML = `<div id="content"></div>`;
    });

    test('setElementHTML establece contenido HTML', () => {
        setElementHTML('content', '<p>Hello</p>');
        const div = document.getElementById('content');
        expect(div.innerHTML).toBe('<p>Hello</p>');
    });

});

describe('DOM Helpers - Class Manipulation', () => {

    beforeEach(() => {
        document.body.innerHTML = `<div id="box" class="base"></div>`;
    });

    test('addElementClass añade clase', () => {
        addElementClass('box', 'active');
        const box = document.getElementById('box');
        expect(box.classList.contains('active')).toBe(true);
    });

    test('removeElementClass elimina clase', () => {
        const box = document.getElementById('box');
        box.classList.add('active');

        removeElementClass('box', 'active');
        expect(box.classList.contains('active')).toBe(false);
    });

});
