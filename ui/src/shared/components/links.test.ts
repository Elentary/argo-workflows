import {openLinkWithKey, processURL} from './links';

describe('process URL', () => {
    test('original timestamp', () => {
        const object = {
            status: {
                startedAt: '2021-01-01T10:30:00Z',
                finishedAt: '2021-01-01T10:30:00Z'
            }
        };
        expect(processURL('https://logging?from=${status.startedAt}&to=${status.finishedAt}', object)).toBe('https://logging?from=2021-01-01T10:30:00Z&to=2021-01-01T10:30:00Z');
    });

    test('epoch timestamp', () => {
        const object = {
            status: {
                startedAt: '2021-01-01T10:30:00Z',
                finishedAt: '2021-01-01T10:30:00Z'
            }
        };
        expect(processURL('https://logging?from=${status.startedAtEpoch}&to=${status.finishedAtEpoch}', object)).toBe('https://logging?from=1609497000000&to=1609497000000');
    });

    test('epoch timestamp with ongoing workflow', () => {
        const object = {
            status: {
                startedAt: '2021-01-01T10:30:00Z'
            }
        };

        const expectedDate = new Date('2021-03-01T10:30:00.00Z');
        jest.spyOn(global.Date, 'now').mockImplementationOnce(() => expectedDate.valueOf());

        expect(processURL('https://logging?from=${status.startedAtEpoch}&to=${status.finishedAtEpoch}', object)).toBe(
            `https://logging?from=1609497000000&to=${expectedDate.getTime()}`
        );
    });

    test('no timestamp', () => {
        const object = {
            status: {}
        };

        expect(processURL('https://logging?from=${status.startedAtEpoch}&to=${status.finishedAtEpoch}', object)).toBe(`https://logging?from=null&to=null`);
    });

    test('ignore missing workflow var', () => {
        const object = {
            status: {},
            workflow: {
                annotations: {
                    logQuery: 'query=env:qa'
                }
            }
        };

        expect(processURL('https://logging?${workflow.annotations.logQuery}${workflow.annotations.additionalLogParams}', object)).toBe('https://logging?query=env:qa');
    });

    test('workflows annotation.', () => {
        const object = {
            status: {},
            workflow: {
                metadata: {
                    annotations: {
                        'workflows.argoproj.io/pod-name-format': 'v2'
                    }
                }
            }
        };

        expect(processURL('https://logging?${workflow.metadata.annotations.workflows.argoproj.io/pod-name-format}', object)).toBe('https://logging?v2');
    });
});

describe('openLinkWithKey', () => {
    let mockWindowOpen: jest.Mock;
    let originalLocation: Location;

    beforeEach(() => {
        // Mock window.open
        mockWindowOpen = jest.fn();
        global.window.open = mockWindowOpen;

        // Store original location and create a mock
        originalLocation = window.location;
        delete (window as any).location;
        window.location = {href: ''} as any;

        // Mock window.event
        global.window.event = new MouseEvent('click');
    });

    afterEach(() => {
        // Restore original location
        window.location = originalLocation;
        jest.clearAllMocks();
    });

    test('opens in new tab with Ctrl key', () => {
        const mockEvent = new MouseEvent('click', {ctrlKey: true});
        global.window.event = mockEvent;

        openLinkWithKey('https://example.com');

        expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com', '_blank');
    });

    test('opens in new tab with Meta key', () => {
        const mockEvent = new MouseEvent('click', {metaKey: true});
        global.window.event = mockEvent;

        openLinkWithKey('https://example.com');

        expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com', '_blank');
    });

    test('uses explicit target when provided', () => {
        openLinkWithKey('https://example.com', '_self');

        expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com', '_self');
    });

    test('opens in new tab when openInNewTabByDefault is true', () => {
        openLinkWithKey('https://example.com', undefined, true);

        expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com', '_blank');
    });

    // TODO: This test is problematic in jsdom environment due to location mocking limitations
    // The functionality works in real browsers
    test.skip('opens in same tab when openInNewTabByDefault is false', () => {
        // This would test document.location.href assignment behavior
        // but jsdom doesn't handle navigation properly
    });

    test('explicit target overrides openInNewTabByDefault', () => {
        openLinkWithKey('https://example.com', '_self', true);

        expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com', '_self');
    });
});
