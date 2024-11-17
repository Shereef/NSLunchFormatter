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
    if (strData.trim() === '') {
        return [];
    }
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
                    homeRoomDict[className] = { Location: 'Eaglewood' };
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

function addFooter(doc, pageNumber, formattedDate) {
    const footer = `Page ${pageNumber} for Date: ${formattedDate}`;
    doc.setFontSize(10);
    doc.setTextColor('#000000');
    doc.text(
        footer,
        (doc.internal.pageSize.width - doc.getTextWidth(footer)) / 2,
        290
    );
    const originalFooter =
        'Generated by https://shereef.github.io/NSLunchFormatter/';
    doc.text(
        originalFooter,
        (doc.internal.pageSize.width - doc.getTextWidth(originalFooter)) / 2,
        280
    );
}

function addSummaryTable(doc, data, pageWidth) {
    let y = 10;
    doc.setFontSize(18);
    doc.text(
        'Summary Report',
        (pageWidth - doc.getTextWidth('Summary Report')) / 2,
        y
    );
    y += 10;
    doc.setFontSize(12);

    Object.keys(data).forEach((date) => {
        const dateData = data[date];
        doc.setFontSize(14);
        doc.text(`Date: ${date}`, 10, y);
        y += 10;

        if (dateData.locations) {
            Object.keys(dateData.locations).forEach((location) => {
                const locationData = dateData.locations[location];
                doc.setFontSize(12);
                doc.text(`Location: ${location}`, 20, y);
                y += 10;

                const homeRoomNames = locationData.classes.map(
                    (classData) => classData.name
                );
                const mealNames = [
                    ...new Set(
                        locationData.classes.flatMap((classData) =>
                            Object.keys(classData.mealCounts)
                        )
                    )
                ];

                const tableHead = [['Home Room', ...mealNames]];
                const tableBody = homeRoomNames.map((homeRoom) => [
                    homeRoom,
                    ...mealNames.map((meal) => {
                        const classData = locationData.classes.find(
                            (classData) => classData.name === homeRoom
                        );
                        return classData ? classData.mealCounts[meal] || 0 : 0;
                    })
                ]);

                doc.autoTable({
                    startY: y,
                    head: tableHead,
                    body: tableBody,
                    theme: 'grid',
                    styles: { fontSize: 10 },
                    margin: { left: 20 }
                });
                y = doc.autoTable.previous.finalY + 10;
            });
        } else {
            const homeRoomNames = dateData.classes.map(
                (classData) => classData.name
            );
            const mealNames = [
                ...new Set(
                    dateData.classes.flatMap((classData) =>
                        Object.keys(classData.mealCounts)
                    )
                )
            ];

            const tableHead = [['Home Room', ...mealNames]];
            const tableBody = homeRoomNames.map((homeRoom) => [
                homeRoom,
                ...mealNames.map((meal) => {
                    const classData = dateData.classes.find(
                        (classData) => classData.name === homeRoom
                    );
                    return classData ? classData.mealCounts[meal] || 0 : 0;
                })
            ]);

            doc.autoTable({
                startY: y,
                head: tableHead,
                body: tableBody,
                theme: 'grid',
                styles: { fontSize: 10 },
                margin: { left: 20 }
            });
            y = doc.autoTable.previous.finalY + 10;
        }
        y += 10;
    });
}

function getColorForLocation(location, locationColors, colors) {
    if (!locationColors[location]) {
        locationColors[location] =
            colors[Object.keys(locationColors).length % colors.length];
    }
    return locationColors[location];
}

function getColorForMeal(meal, mealColors, colors) {
    if (!mealColors[meal]) {
        mealColors[meal] =
            colors[Object.keys(mealColors).length % colors.length];
    }
    return mealColors[meal];
}

function addSummaryPage(doc, data, pageWidth) {
    addSummaryTable(doc, data, pageWidth);
    doc.addPage();
}

function addDatePage(
    doc,
    date,
    data,
    pageWidth,
    pageHeight,
    colors,
    locationColors,
    mealColors,
    printDate
) {
    const atlanticTimeOptions = { timeZone: 'America/Halifax', hour12: false };
    const [day, month, year] = date.split('-');
    const fullYear = year.length === 2 ? `20${year}` : year;
    const monthIndex = new Date(`${month} 1`).getMonth();
    const formattedDateStr = `${fullYear}-${String(monthIndex + 1).padStart(2, '0')}-${day}T00:00:00`;
    let parsedDate = new Date(
        new Date(formattedDateStr).toLocaleString('en-CA', atlanticTimeOptions)
    );
    let formattedDate = parsedDate
        .toLocaleString('en-CA', {
            ...atlanticTimeOptions,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
        .split(',')[0];
    if (isNaN(parsedDate)) {
        console.error(`Invalid date: ${date}, using date as-is.`);
        parsedDate = new Date(date);
        formattedDate = date;
    }
    if (isNaN(parsedDate)) {
        console.error(`Invalid date: ${date}`);
        return;
    }
    let pageNumber = 1;
    doc.setFontSize(18);
    const summaryTitle = 'NSLunch Report';
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
            doc.setTextColor(
                getColorForLocation(location, locationColors, colors)
            );
            doc.text(`Location: ${location}`, 10, y);
            y += 10;
            doc.text(`Total Meals: ${locationData.totalMeals}`, 20, y);
            y += 10;
            Object.keys(locationData.mealCounts).forEach((meal) => {
                doc.setTextColor(getColorForMeal(meal, mealColors, colors));
                doc.text(`${meal}: ${locationData.mealCounts[meal]}`, 30, y);
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
                if (pageNumber > 1) {
                    doc.addPage();
                    pageNumber++;
                    y = 10;
                }
                doc.setFontSize(16);
                doc.setTextColor(
                    getColorForLocation(location, locationColors, colors)
                );
                const locationTitle = `Location: ${location}`;
                const locationDateText = `${locationTitle}    ${dateTitle}`;
                doc.text(
                    locationDateText,
                    (pageWidth - doc.getTextWidth(locationDateText)) / 2,
                    y
                );
                y += 10;
                doc.setFontSize(16);
                const classTitle = `Class: ${classData.name}${classData.room ? ` (Room: ${classData.room})` : ''}`;
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
                    doc.setTextColor(
                        getColorForMeal(mealName, mealColors, colors)
                    );
                    doc.text(`${mealName} x ${meals.length}`, 15, y);
                    y += 10;
                    meals.forEach((meal) => {
                        if (y + 10 > pageHeight) {
                            doc.addPage();
                            pageNumber++;
                            y = 10;
                            doc.setFontSize(16);
                            doc.setTextColor(
                                getColorForLocation(
                                    location,
                                    locationColors,
                                    colors
                                )
                            );
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
                                (pageWidth - doc.getTextWidth(classTitle)) / 2,
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
        });
    } else {
        dateData.classes.forEach((classData) => {
            if (pageNumber > 1) {
                doc.addPage();
                pageNumber++;
                y = 10;
            }
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
                doc.setTextColor(getColorForMeal(mealName, mealColors, colors));
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
}

function exportToPDF(data, selectedDates) {
    const { jsPDF } = window.jspdf; // Ensure jsPDF is correctly referenced
    const doc = new jsPDF();
    const pageWidth =
        doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const pageHeight =
        doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const atlanticTimeOptions = { timeZone: 'America/Halifax', hour12: false };
    const printDate = new Date()
        .toLocaleString('en-CA', atlanticTimeOptions)
        .replace(/,/, '')
        .replace(/:/g, '-');
    const locationColors = {};
    const mealColors = {};
    const colors = ['#2E4053', '#1F618D', '#117A65'];

    addSummaryPage(doc, data, pageWidth);

    Object.keys(data).forEach((date) => {
        addDatePage(
            doc,
            date,
            data,
            pageWidth,
            pageHeight,
            colors,
            locationColors,
            mealColors,
            printDate
        );
    });

    const dateRange =
        selectedDates.length === 1
            ? selectedDates[0]
            : `${selectedDates[0]}-${selectedDates[selectedDates.length - 1]}`;
    const fileName = `NSLunch Report for ${dateRange} Generated on ${printDate}.pdf`;
    doc.save(fileName);
}

function listDates(dates) {
    const dateContainer = document.getElementById('date-container');
    dateContainer.innerHTML = '';
    dates.forEach((date) => {
        const dateCheckbox = document.createElement('input');
        dateCheckbox.type = 'checkbox';
        dateCheckbox.id = date;
        dateCheckbox.name = 'dates';
        dateCheckbox.value = date;
        dateCheckbox.checked = shouldDateBeChecked(date);
        const dateLabel = document.createElement('label');
        dateLabel.htmlFor = date;
        dateLabel.textContent = date;
        dateContainer.appendChild(dateCheckbox);
        dateContainer.appendChild(dateLabel);
        dateContainer.appendChild(document.createElement('br'));
    });
}

function shouldDateBeChecked(date) {
    const today = new Date();
    const [day, month, year] = date.split('-');
    const dateObj = new Date(`${year}-${month}-${day}`);
    if (today.getDay() === 1) {
        // Monday
        return dateObj >= today;
    } else {
        return dateObj.toDateString() === today.toDateString();
    }
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
            const selectedDates = Array.from(
                document.querySelectorAll('input[name="dates"]:checked')
            ).map((input) => input.value);
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
                    const filteredData = userInputData.filter((row) =>
                        selectedDates.includes(row[0])
                    );
                    const sortByLocation = filteredData.some(
                        (row) => homeRoomDict[row[2]]
                    );
                    const transformedData = transformUserInputData(
                        filteredData,
                        sortByLocation ? homeRoomDict : null
                    );
                    exportToPDF(transformedData, selectedDates);
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
            const userInputCsvReader = new FileReader();
            userInputCsvReader.onload = function (csvEventUserInput) {
                const csvTextUserInput = csvEventUserInput.target.result;
                const userInputData = csvToArray(csvTextUserInput);
                userInputData.shift();
                userInputData.shift();
                const dates = [...new Set(userInputData.map((row) => row[0]))];
                listDates(dates);
            };
            userInputCsvReader.readAsText(this.files[0]);
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
        transformUserInputData,
        sortMeals,
        exportToPDF,
        hideAdvancedOptionsCheckedChange,
        getHomeRoomInfo,
        addFooter
    };
}
