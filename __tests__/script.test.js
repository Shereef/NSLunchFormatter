/* eslint-env jest */
const {
    csvToArray,
    convertHomeRoomDataToDict,
    transformUserInputData
} = require('../script');

beforeAll(() => {
    // Mock the document object
    global.document = {
        getElementById: jest.fn((id) => {
            if (id === 'processBtn' || id === 'csvFile') {
                return {
                    addEventListener: jest.fn(),
                    files: [],
                    value: ''
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
});
