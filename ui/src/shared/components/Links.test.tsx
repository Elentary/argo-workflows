import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import * as React from 'react';
import {Links} from './links';
import {services} from '../services';
import {Link, ObjectMeta} from '../models';

describe('Links component', () => {
    const mockLink: Link = {
        name: 'Test Link',
        scope: 'test',
        url: 'http://test.net'
    };

    const mockObject: {metadata: ObjectMeta} = {
        metadata: {
            name: 'test-object'
        }
    };

    beforeEach(() => {
        // Mock the getInfo service to return a custom link
        mockLink.openInNewTab = undefined;
        mockLink.target = undefined;
        jest.spyOn(services.info, 'getInfo').mockImplementation(async () => {
            return {
                links: [mockLink],
                modals: {string: false},
                managedNamespace: '',
                navColor: '',
                columns: []
            };
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('opens in new tab by default', async () => {
        render(<Links scope='test' object={mockObject} />);
        const linkElement = await screen.findByText('Test Link');
        expect(linkElement).toHaveAttribute('target', '_blank');
    });

    it('opens in new tab when openInNewTab is true', async () => {
        mockLink.openInNewTab = true;
        render(<Links scope='test' object={mockObject} />);
        const linkElement = await screen.findByText('Test Link');
        expect(linkElement).toHaveAttribute('target', '_blank');
    });

    it('opens in same tab when openInNewTab is false', async () => {
        mockLink.openInNewTab = false;
        render(<Links scope='test' object={mockObject} />);
        const linkElement = await screen.findByText('Test Link');
        expect(linkElement).not.toHaveAttribute('target');
    });

    it('respects target when openInNewTab is false', async () => {
        mockLink.openInNewTab = false;
        mockLink.target = '_self';
        render(<Links scope='test' object={mockObject} />);
        const linkElement = await screen.findByText('Test Link');
        expect(linkElement).toHaveAttribute('target', '_self');
    });
});
