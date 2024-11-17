/* eslint-env jest */
const {
    csvToArray,
    convertHomeRoomDataToDict,
    transformUserInputData,
    sortMeals,
    exportToPDF,
    hideAdvancedOptionsCheckedChange,
    getHomeRoomInfo,
    addFooter,
    validateCSVData,
    parseCSVFile
} = require('../script');

beforeAll(() => {
    // Mock the document object
    global.document = {
        getElementById: jest.fn((id) => {
            if (id === 'processBtn' || id === 'csvFile') {
                return {
                    addEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                    files: [],
                    value: ''
                };
            }
            if (id === 'hideAdvancedOptions') {
                return {
                    addEventListener: jest.fn(),
                    checked: false
                };
            }
            if (id === 'homeRoomInfo') {
                return {
                    value: 'home room info'
                };
            }
            if (id === 'error-container') {
                return {
                    textContent: '',
                    style: {
                        display: 'none'
                    }
                };
            }
            return null;
        }),
        querySelector: jest.fn().mockReturnValue({
            classList: {
                add: jest.fn(),
                remove: jest.fn()
            },
            textContent: ''
        }),
        createElement: jest.fn().mockReturnValue({
            style: {
                display: ''
            }
        }),
        getElementsByClassName: jest.fn().mockReturnValue([])
    };

    // Mock window.alert
    global.alert = jest.fn();

    // Mock window.jspdf
    global.window.jspdf = {
        jsPDF: jest.fn().mockImplementation(() => ({
            text: jest.fn(),
            setFontSize: jest.fn(),
            setTextColor: jest.fn(),
            addPage: jest.fn(),
            save: jest.fn(),
            getTextWidth: jest.fn().mockReturnValue(50),
            setPage: jest.fn(),
            splitTextToSize: jest.fn().mockReturnValue(['']),
            internal: {
                pageSize: {
                    getWidth: jest.fn().mockReturnValue(210),
                    getHeight: jest.fn().mockReturnValue(297),
                    height: 297,
                    width: 210
                },
                getNumberOfPages: jest.fn().mockReturnValue(1)
            }
        }))
    };
});

afterEach(() => {
    jest.resetAllMocks();
});

describe('csvToArray', () => {
    test('should convert CSV string to array', () => {
        const csvString = 'name,age\nJohn,30\nJane,25';
        const expectedArray = [
            ['name', 'age'],
            ['John', '30'],
            ['Jane', '25']
        ];
        expect(csvToArray(csvString)).toEqual(expectedArray);
    });

    test('should handle empty CSV string', () => {
        const csvString = '';
        const expectedArray = [];
        expect(csvToArray(csvString)).toEqual(expectedArray);
    });

    test('should handle CSV string with only headers', () => {
        const csvString = 'name,age';
        const expectedArray = [['name', 'age']];
        expect(csvToArray(csvString)).toEqual(expectedArray);
    });

    test('should handle CSV string with empty fields', () => {
        const csvString = 'name,age\nJohn,\n,25';
        const expectedArray = [
            ['name', 'age'],
            ['John', ''],
            ['', '25']
        ];
        expect(csvToArray(csvString)).toEqual(expectedArray);
    });
});

describe('convertHomeRoomDataToDict', () => {
    test('should convert home room data array to dictionary', () => {
        const homeRoomData = [
            ['01Isenor', 'Eaglewood', '101'],
            ['0Coughlin', 'Fort Sackville', '4']
        ];
        const expectedDict = {
            '01Isenor': { Location: 'Eaglewood', Room: '101' },
            '0Coughlin': { Location: 'Fort Sackville', Room: '4' }
        };
        expect(convertHomeRoomDataToDict(homeRoomData)).toEqual(expectedDict);
    });

    test('should handle empty home room data array', () => {
        const homeRoomData = [];
        const expectedDict = {};
        expect(convertHomeRoomDataToDict(homeRoomData)).toEqual(expectedDict);
    });
});

describe('transformUserInputData', () => {
    test('should transform user input data correctly', () => {
        const userInputData = [
            ['2024-01-01', 'Grade 1', '01Isenor', 'John Doe', '1', 'Pizza'],
            ['2024-01-01', 'Grade 1', '01Isenor', 'Jane Doe', '2', 'Burger']
        ];
        const homeRoomDict = {
            '01Isenor': { Location: 'Eaglewood', Room: '101' }
        };
        const expectedData = {
            '2024-01-01': {
                totalMeals: 3,
                mealCounts: { Pizza: 1, Burger: 2 },
                classes: [
                    {
                        name: '01Isenor',
                        totalMeals: 3,
                        mealCounts: { Pizza: 1, Burger: 2 },
                        meals: [
                            {
                                name: 'Burger',
                                Student: 'Jane Doe',
                                Quantity: 2
                            },
                            { name: 'Pizza', Student: 'John Doe', Quantity: 1 }
                        ]
                    }
                ],
                locations: {
                    Eaglewood: {
                        totalMeals: 3,
                        mealCounts: { Pizza: 1, Burger: 2 },
                        classes: [
                            {
                                name: '01Isenor',
                                room: '101',
                                totalMeals: 3,
                                mealCounts: { Pizza: 1, Burger: 2 },
                                meals: [
                                    {
                                        name: 'Burger',
                                        Student: 'Jane Doe',
                                        Quantity: 2
                                    },
                                    {
                                        name: 'Pizza',
                                        Student: 'John Doe',
                                        Quantity: 1
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        };
        expect(transformUserInputData(userInputData, homeRoomDict)).toEqual(
            expectedData
        );
    });

    test('should transform user input data correctly without locations', () => {
        const userInputData = [
            ['2024-01-01', 'Grade 1', '01Isenor', 'John Doe', '1', 'Pizza'],
            ['2024-01-01', 'Grade 1', '01Isenor', 'Jane Doe', '2', 'Burger']
        ];
        const expectedData = {
            '2024-01-01': {
                totalMeals: 3,
                mealCounts: { Pizza: 1, Burger: 2 },
                classes: [
                    {
                        name: '01Isenor',
                        totalMeals: 3,
                        mealCounts: { Pizza: 1, Burger: 2 },
                        meals: [
                            {
                                name: 'Burger',
                                Student: 'Jane Doe',
                                Quantity: 2
                            },
                            { name: 'Pizza', Student: 'John Doe', Quantity: 1 }
                        ]
                    }
                ],
                locations: null
            }
        };
        expect(transformUserInputData(userInputData, null)).toEqual(
            expectedData
        );
    });

    test('should transform user input data correctly with locations', () => {
        const userInputData = [
            ['2024-01-01', 'Grade 1', '01Isenor', 'John Doe', '1', 'Pizza'],
            ['2024-01-01', 'Grade 1', '01Isenor', 'Jane Doe', '2', 'Burger']
        ];
        const homeRoomDict = {
            '01Isenor': { Location: 'Eaglewood', Room: '101' }
        };
        const expectedData = {
            '2024-01-01': {
                totalMeals: 3,
                mealCounts: { Pizza: 1, Burger: 2 },
                classes: [
                    {
                        name: '01Isenor',
                        totalMeals: 3,
                        mealCounts: { Pizza: 1, Burger: 2 },
                        meals: [
                            {
                                name: 'Burger',
                                Student: 'Jane Doe',
                                Quantity: 2
                            },
                            { name: 'Pizza', Student: 'John Doe', Quantity: 1 }
                        ]
                    }
                ],
                locations: {
                    Eaglewood: {
                        totalMeals: 3,
                        mealCounts: { Pizza: 1, Burger: 2 },
                        classes: [
                            {
                                name: '01Isenor',
                                room: '101',
                                totalMeals: 3,
                                mealCounts: { Pizza: 1, Burger: 2 },
                                meals: [
                                    {
                                        name: 'Burger',
                                        Student: 'Jane Doe',
                                        Quantity: 2
                                    },
                                    {
                                        name: 'Pizza',
                                        Student: 'John Doe',
                                        Quantity: 1
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        };
        expect(transformUserInputData(userInputData, homeRoomDict)).toEqual(
            expectedData
        );
    });

    test('should handle empty user input data', () => {
        const userInputData = [];
        const homeRoomDict = {
            '01Isenor': { Location: 'Eaglewood', Room: '101' }
        };
        const expectedData = {};
        expect(transformUserInputData(userInputData, homeRoomDict)).toEqual(
            expectedData
        );
    });
});

describe('sortMeals', () => {
    test('should sort meals by name, quantity, and student name', () => {
        const meals = [
            { name: 'Burger', Quantity: 2, Student: 'Jane Doe' },
            { name: 'Pizza', Quantity: 1, Student: 'John Doe' },
            { name: 'Burger', Quantity: 1, Student: 'John Doe' }
        ];
        const expectedSortedMeals = [
            { name: 'Burger', Quantity: 2, Student: 'Jane Doe' },
            { name: 'Burger', Quantity: 1, Student: 'John Doe' },
            { name: 'Pizza', Quantity: 1, Student: 'John Doe' }
        ];
        expect(sortMeals(meals)).toEqual(expectedSortedMeals);
    });
});

describe('hideAdvancedOptionsCheckedChange', () => {
    test('should hide advanced options when checkbox is checked', () => {
        document.getElementById = jest.fn((id) => {
            if (id === 'hideAdvancedOptions') {
                return { checked: true };
            }
            return null;
        });
        const advancedOptions = [{ style: { display: '' } }];
        document.getElementsByClassName = jest.fn(() => advancedOptions);

        hideAdvancedOptionsCheckedChange();

        expect(advancedOptions[0].style.display).toBe('none');
    });

    test('should show advanced options when checkbox is unchecked', () => {
        document.getElementById = jest.fn((id) => {
            if (id === 'hideAdvancedOptions') {
                return { checked: false };
            }
            return null;
        });
        const advancedOptions = [{ style: { display: '' } }];
        document.getElementsByClassName = jest.fn(() => advancedOptions);

        hideAdvancedOptionsCheckedChange();

        expect(advancedOptions[0].style.display).toBe('inline-block');
    });
});

describe('getHomeRoomInfo', () => {
    test('should return trimmed home room info', () => {
        document.getElementById = jest.fn(() => ({
            value: '  home room info  '
        }));
        expect(getHomeRoomInfo()).toBe('home room info');
    });
});

describe('addFooter', () => {
    test('should add footer to the PDF document', () => {
        const doc = {
            setFontSize: jest.fn(),
            setTextColor: jest.fn(),
            text: jest.fn(),
            getTextWidth: jest.fn().mockReturnValue(50),
            internal: {
                pageSize: {
                    width: 210,
                    height: 297
                }
            }
        };
        const pageNumber = 1;
        const formattedDate = '2024-01-01';

        addFooter(doc, pageNumber, formattedDate);

        expect(doc.setFontSize).toHaveBeenCalledWith(10);
        expect(doc.setTextColor).toHaveBeenCalledWith('#000000');
        expect(doc.text).toHaveBeenCalledWith(
            'Page 1 for Date: 2024-01-01',
            80,
            290
        );
        expect(doc.text).toHaveBeenCalledWith(
            'Generated by https://shereef.github.io/NSLunchFormatter/',
            80,
            280
        );
    });
});

describe('validateCSVData', () => {
    test('should throw an error for empty CSV data', () => {
        expect(() => validateCSVData([])).toThrow('CSV data is empty or invalid.');
    });

    test('should return true for valid CSV data', () => {
        expect(validateCSVData([['name', 'age'], ['John', '30']])).toBe(true);
    });
});

describe('parseCSVFile', () => {
    test('should parse CSV file and call callback with data', (done) => {
        const file = new Blob(['name,age\nJohn,30\nJane,25'], { type: 'text/csv' });
        const callback = jest.fn((data) => {
            expect(data).toEqual([
                ['name', 'age'],
                ['John', '30'],
                ['Jane', '25']
            ]);
            done();
        });
        parseCSVFile(file, callback);
    });
});
