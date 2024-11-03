/* eslint-env browser */
/*
MIT License

© 2024 Shereef Marzouk

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

function csvToArray(strData, strDelimiter = ',') {
    const objPattern = new RegExp(
        '(\\' +
            strDelimiter +
            '|\\r?\\n|\\r|^)' +
            '(?:"([^"]*(?:""[^"]*)*)"|' +
            '([^"\\' +
            strDelimiter +
            '\\r\\n]*))',
        'gi'
    );
    const arrData = [[]];
    let arrMatches = null;
    while ((arrMatches = objPattern.exec(strData))) {
        const strMatchedDelimiter = arrMatches[1];
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
        ) {
            arrData.push([]);
        }
        const strMatchedValue = arrMatches[2]
            ? arrMatches[2].replace(/""/g, '"')
            : arrMatches[3];
        arrData[arrData.length - 1].push(strMatchedValue);
    }
    return arrData.filter((row) => row.some((cell) => cell.trim() !== ''));
}

function hideAdvancedOptionsCheckedChange() {
    const hideAdvancedOptions = document.getElementById(
        'hideAdvancedOptions'
    ).checked;
    const optionals = document.getElementsByClassName('advanced-option');
    for (const advancedOption of optionals) {
        advancedOption.style.display = hideAdvancedOptions ? 'none' : 'block';
    }
    const optionals2 = document.getElementsByClassName(
        'advanced-option-inline-block'
    );
    for (const advancedOption of optionals2) {
        advancedOption.style.display = hideAdvancedOptions
            ? 'none'
            : 'inline-block';
    }
    if (window.innerWidth <= 768) {
        const elementsToHide = document.querySelectorAll(
            'h1, p:not(.instructions p), .checkbox-container'
        );
        for (const element of elementsToHide) {
            element.style.display = hideAdvancedOptions ? 'none' : 'block';
        }
    }
}

function getHomeRoomInfo() {
    return document.getElementById('homeRoomInfo').value.trim();
}

function convertHomeRoomDataToDict(homeRoomData) {
    const homeRoomDict = {};
    homeRoomData.forEach(([homeRoomName, location, roomNumber]) => {
        homeRoomDict[homeRoomName] = { Location: location, Room: roomNumber };
    });
    return homeRoomDict;
}

function sortMeals(meals) {
    return meals.sort(
        (a, b) =>
            a.name.localeCompare(b.name) ||
            b.Quantity - a.Quantity ||
            a.Student.localeCompare(b.Student)
    );
}

function transformUserInputData(userInputData, homeRoomDict) {
    const result = {};
    userInputData.forEach(
        ([date, , className, studentName, quantity, mealName]) => {
            if (!result[date]) {
                result[date] = {
                    totalMeals: 0,
                    mealCounts: {},
                    classes: [],
                    locations: homeRoomDict ? {} : null
                };
            }
            let classEntry = result[date].classes.find(
                (c) => c.name === className
            );
            if (!classEntry) {
                classEntry = {
                    name: className,
                    totalMeals: 0,
                    mealCounts: {},
                    meals: []
                };
                result[date].classes.push(classEntry);
            }
            const mealQuantity = parseInt(quantity, 10);
            classEntry.totalMeals += mealQuantity;
            result[date].totalMeals += mealQuantity;
            classEntry.meals.push({
                name: mealName,
                Student: studentName,
                Quantity: mealQuantity
            });
            classEntry.mealCounts[mealName] =
                (classEntry.mealCounts[mealName] || 0) + mealQuantity;
            result[date].mealCounts[mealName] =
                (result[date].mealCounts[mealName] || 0) + mealQuantity;

            if (homeRoomDict) {
                let location = homeRoomDict[className]?.Location || 'Eaglewood';
                if (!homeRoomDict[className]) {
                    console.warn(
                        `Class ${className} not found in homeRoomDict, assuming location is Eaglewood`
                    );
                }
                if (!result[date].locations[location]) {
                    result[date].locations[location] = {
                        totalMeals: 0,
                        mealCounts: {},
                        classes: []
                    };
                }
                let locationClassEntry = result[date].locations[
                    location
                ].classes.find((c) => c.name === className);
                if (!locationClassEntry) {
                    const room = homeRoomDict[className]?.Room;
                    locationClassEntry = {
                        name: className,
                        room: room,
                        totalMeals: 0,
                        mealCounts: {},
                        meals: []
                    };
                    result[date].locations[location].classes.push(
                        locationClassEntry
                    );
                }
                locationClassEntry.totalMeals += mealQuantity;
                result[date].locations[location].totalMeals += mealQuantity;
                locationClassEntry.meals.push({
                    name: mealName,
                    Student: studentName,
                    Quantity: mealQuantity
                });
                locationClassEntry.mealCounts[mealName] =
                    (locationClassEntry.mealCounts[mealName] || 0) +
                    mealQuantity;
                result[date].locations[location].mealCounts[mealName] =
                    (result[date].locations[location].mealCounts[mealName] ||
                        0) + mealQuantity;
            }
        }
    );

    Object.keys(result).forEach((date) => {
        result[date].classes.forEach((classEntry) => {
            classEntry.meals = sortMeals(classEntry.meals);
        });
        if (result[date].locations) {
            Object.keys(result[date].locations).forEach((location) => {
                result[date].locations[location].classes.forEach(
                    (classEntry) => {
                        classEntry.meals = sortMeals(classEntry.meals);
                    }
                );
            });
        }
    });
    return result;
}

function exportToPDF(data) {
    const { jsPDF } = window.jspdf; // Ensure jsPDF is correctly referenced
    const doc = new jsPDF();
    const pageWidth =
        doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const pageHeight =
        doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const printDate = new Date()
        .toISOString()
        .replace(/T/, ' ')
        .replace(/\..+/, '');
    const locationColors = {};
    const mealColors = {};
    let locationColorIndex = 0;
    let mealColorIndex = 0;
    const colors = ['#2E4053', '#1F618D', '#117A65'];

    function getColorForLocation(location) {
        if (!locationColors[location]) {
            locationColors[location] =
                colors[locationColorIndex % colors.length];
            locationColorIndex++;
        }
        return locationColors[location];
    }

    function getColorForMeal(meal) {
        if (!mealColors[meal]) {
            mealColors[meal] = colors[mealColorIndex % colors.length];
            mealColorIndex++;
        }
        return mealColors[meal];
    }

    function addFooter(doc, pageNumber, formattedDate) {
        const footer = `Page ${pageNumber} for Date: ${formattedDate}`;
        doc.setFontSize(10);
        doc.setTextColor('#000000');
        doc.text(footer, (pageWidth - doc.getTextWidth(footer)) / 2, 290);
        const originalFooter =
            'Generated by https://shereef.github.io/NSLunchFormatter/';
        doc.text(
            originalFooter,
            (pageWidth - doc.getTextWidth(originalFooter)) / 2,
            280
        );
    }

    let pageNumber = 0;
    Object.keys(data).forEach((date) => {
        pageNumber = 1;
        const formattedDate = new Date(date).toISOString().split('T')[0];
        doc.setFontSize(18);
        const summaryTitle = 'NSLunch Report Summary';
        doc.text(
            summaryTitle,
            (pageWidth - doc.getTextWidth(summaryTitle)) / 2,
            10
        );
        doc.setFontSize(14);
        const generatedOnText = `Generated on: ${printDate}`;
        doc.text(
            generatedOnText,
            (pageWidth - doc.getTextWidth(generatedOnText)) / 2,
            20
        );
        let y = 30;
        const dateData = data[date];
        doc.setFontSize(16);
        const dateTitle = `Date: ${formattedDate}`;
        doc.text(dateTitle, (pageWidth - doc.getTextWidth(dateTitle)) / 2, y);
        y += 10;
        doc.setFontSize(14);
        doc.text(`Total Meals for the School: ${dateData.totalMeals}`, 10, y);
        y += 10;

        if (dateData.locations) {
            Object.keys(dateData.locations).forEach((location) => {
                const locationData = dateData.locations[location];
                doc.setFontSize(14);
                doc.setTextColor(getColorForLocation(location));
                doc.text(`Location: ${location}`, 10, y);
                y += 10;
                doc.text(`Total Meals: ${locationData.totalMeals}`, 20, y);
                y += 10;
                Object.keys(locationData.mealCounts).forEach((meal) => {
                    doc.setTextColor(getColorForMeal(meal));
                    doc.text(
                        `${meal}: ${locationData.mealCounts[meal]}`,
                        30,
                        y
                    );
                    y += 10;
                });
                y += 10;
            });
        }

        y += 10;
        addFooter(doc, pageNumber, formattedDate);
        doc.setPage(1);

        if (dateData.locations) {
            Object.keys(dateData.locations).forEach((location) => {
                const locationData = dateData.locations[location];
                locationData.classes.forEach((classData) => {
                    doc.addPage();
                    pageNumber++;
                    y = 10;
                    doc.setFontSize(16);
                    doc.setTextColor(getColorForLocation(location));
                    const locationTitle = `Location: ${location}`;
                    const locationDateText = `${locationTitle}    ${dateTitle}`;
                    doc.text(
                        locationDateText,
                        (pageWidth - doc.getTextWidth(locationDateText)) / 2,
                        y
                    );
                    y += 10;
                    doc.setFontSize(16);
                    const classTitle = `Class: ${classData.name}${
                        classData.room ? ` (Room: ${classData.room})` : ''
                    }`;
                    doc.text(
                        classTitle,
                        (pageWidth - doc.getTextWidth(classTitle)) / 2,
                        y
                    );
                    y += 10;
                    doc.setFontSize(14);
                    doc.text(`Total Meals: ${classData.totalMeals}`, 10, y);
                    y += 10;
                    const mealGroups = classData.meals.reduce((acc, meal) => {
                        if (!acc[meal.name]) acc[meal.name] = [];
                        acc[meal.name].push(meal);
                        return acc;
                    }, {});
                    Object.keys(mealGroups).forEach((mealName) => {
                        const meals = mealGroups[mealName];
                        doc.setTextColor(getColorForMeal(mealName));
                        doc.text(`${mealName} x ${meals.length}`, 15, y);
                        y += 10;
                        meals.forEach((meal) => {
                            if (y + 10 > pageHeight) {
                                doc.addPage();
                                pageNumber++;
                                y = 10;
                                doc.setFontSize(16);
                                doc.setTextColor(getColorForLocation(location));
                                doc.text(
                                    locationDateText,
                                    (pageWidth -
                                        doc.getTextWidth(locationDateText)) /
                                        2,
                                    y
                                );
                                y += 10;
                                doc.setFontSize(16);
                                doc.text(
                                    classTitle,
                                    (pageWidth - doc.getTextWidth(classTitle)) /
                                        2,
                                    y
                                );
                                y += 10;
                            }
                            doc.setFontSize(12);
                            doc.text(
                                `${meal.Student}: ${meal.Quantity}`,
                                20,
                                y
                            );
                            y += 10;
                        });
                        y += 5;
                    });
                    addFooter(doc, pageNumber, formattedDate);
                });
            });
        } else {
            dateData.classes.forEach((classData) => {
                doc.addPage();
                pageNumber++;
                y = 10;
                doc.setFontSize(16);
                const classTitle = `Class: ${classData.name}`;
                doc.text(
                    classTitle,
                    (pageWidth - doc.getTextWidth(classTitle)) / 2,
                    y
                );
                y += 10;
                doc.setFontSize(14);
                const dateTitle = `Date: ${formattedDate}`;
                doc.text(
                    dateTitle,
                    (pageWidth - doc.getTextWidth(dateTitle)) / 2,
                    y
                );
                y += 10;
                doc.text(`Total Meals: ${classData.totalMeals}`, 10, y);
                y += 10;
                const mealGroups = classData.meals.reduce((acc, meal) => {
                    if (!acc[meal.name]) acc[meal.name] = [];
                    acc[meal.name].push(meal);
                    return acc;
                }, {});
                Object.keys(mealGroups).forEach((mealName) => {
                    const meals = mealGroups[mealName];
                    doc.setTextColor(getColorForMeal(mealName));
                    doc.text(`${mealName} x ${meals.length}`, 15, y);
                    y += 10;
                    meals.forEach((meal) => {
                        if (y + 10 > pageHeight) {
                            doc.addPage();
                            pageNumber++;
                            y = 10;
                            doc.setFontSize(16);
                            doc.text(
                                classTitle,
                                (pageWidth - doc.getTextWidth(classTitle)) / 2,
                                y
                            );
                            y += 10;
                            doc.setFontSize(14);
                            doc.text(
                                dateTitle,
                                (pageWidth - doc.getTextWidth(dateTitle)) / 2,
                                y
                            );
                            y += 10;
                        }
                        doc.setFontSize(12);
                        doc.text(`${meal.Student}: ${meal.Quantity}`, 20, y);
                        y += 10;
                    });
                    y += 5;
                });
                addFooter(doc, pageNumber, formattedDate);
            });
        }
        doc.addPage();
        pageNumber++;
    });
    const fileName = `NSLunch_Report_${new Date()
        .toISOString()
        .replace(/T/, '_')
        .replace(/:/g, '-')
        .replace(/\..+/, '')}.pdf`;
    doc.save(fileName);
}

document.addEventListener('DOMContentLoaded', function () {
    // Ensure jsPDF library is loaded
    if (!window.jspdf || !window.jspdf.jsPDF) {
        console.error('jsPDF library is not loaded.');
        alert('jsPDF library is not loaded. Please include it in your HTML.');
        return;
    }

    document
        .getElementById('processBtn')
        .addEventListener('click', function () {
            const fileInput = document.getElementById('csvFile');
            if (fileInput.files.length === 0) {
                console.error('Please select a CSV file.');
                alert('Please select a CSV file first.');
                return;
            }
            const homeRoomCsvReader = new FileReader();
            homeRoomCsvReader.onload = function (csvEventHomeRoom) {
                const csvTextHomeRoom = csvEventHomeRoom.target.result;
                const homeRoomData = csvToArray(csvTextHomeRoom);
                homeRoomData.shift();
                const homeRoomDict = convertHomeRoomDataToDict(homeRoomData);
                const userInputCsvReader = new FileReader();
                userInputCsvReader.onload = function (csvEventUserInput) {
                    const csvTextUserInput = csvEventUserInput.target.result;
                    const userInputData = csvToArray(csvTextUserInput);
                    userInputData.shift();
                    userInputData.shift();
                    const sortByLocation = userInputData.some(
                        (row) => homeRoomDict[row[2]]
                    );
                    const transformedData = transformUserInputData(
                        userInputData,
                        sortByLocation ? homeRoomDict : null
                    );
                    exportToPDF(transformedData);
                };
                userInputCsvReader.readAsText(fileInput.files[0]);
            };
            homeRoomCsvReader.readAsText(new Blob([getHomeRoomInfo()]));
        });

    document.getElementById('csvFile').addEventListener('change', function () {
        const fileInputLabel = document.querySelector('.file-input label');
        if (this.files.length > 0) {
            fileInputLabel.classList.add('chosen');
            fileInputLabel.textContent = `File Chosen: ${this.files[0].name}`;
        } else {
            fileInputLabel.classList.remove('chosen');
            fileInputLabel.innerHTML =
                '<i class="fas fa-file-upload"></i> Choose File';
        }
    });

    document
        .getElementById('hideAdvancedOptions')
        .addEventListener('change', hideAdvancedOptionsCheckedChange);
});

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        csvToArray,
        convertHomeRoomDataToDict,
        transformUserInputData
    };
}
