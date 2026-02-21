// Sechedule for weekly
const schedule = [
    {
        day: "Monday",
        subject: ["SM II", "2D",  "Oracle"]
    },
    {
        day: "Tuesday",
        subject: ["IS", "WBD", "Java"]
    },
    {
        day: "Wednesday",
        subject: ["Oracle", "SA", "SM II"]
    },
    {
        day: "Thursday",
        subject: ["WBD", "SA", "MIS"]
    },
    {
        day: "Friday",
        subject: ["MIS", "IS", "NET III"]
    },
    {
        day: "Saturday",
        subject: ["NET III", "Java", "2D"]
    }   
];

const dayRange = {
    "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 0
}

module.exports = {schedule, dayRange};