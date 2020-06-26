const Joi = require('joi');
const mongoose = require('mongoose');
const request = require('request');
const jsreport = require('jsreport');
const fs = require('fs');



const examSchema = new mongoose.Schema({
    subId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscribtion'
    },
    score: {
        type: Number,
        default: 0
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    modelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Model'
    },
    start: {
        //time stamp of starting
        type: Date,
        default: Date.now
    },
    isEnded: {
        type: Boolean,
        default: false
    },
    finalScore: {
        type: Number,
        default: 0
    },
    answers: Object,
    userProgress: [Number],
    sectionStartDate: {
        type: Date,
        default: Date.now
    }
});


const Exam = mongoose.model('Exam', examSchema);


function validateExam(body) {
    let schema = {
        subId: Joi.string().required(),
        modelId: Joi.string().required(),
        userId: Joi.string().required(),
        answers: Joi.array(),
        userProgress: Joi.array()
    };

    return Joi.validate(body, schema);
}



async function startExam(input) {
    let newExam = input.body;
    newExam.userId = input.user._id;
    newExam.answers = [];
    newExam.userProgress = [];

    const { error } = validateExam(newExam);
    if (error) return (error.details[0].message);

    let start = await Exam.insertMany([newExam]);

    return start[0];
}



async function stopExam(input) {
    let examId = input.body._id,
        finalScore = input.body.score

    let stop = await Exam.findByIdAndUpdate(
        examId,
        { $set: { isEnded: true, finalScore } },
        { new: true }
    );

    return stop['isEnded'];
}


async function areEnded() {

    arrAgg = [
        {
            $addFields: {
                getEnded: {
                    $and: [
                        {
                            $gt: [
                                {
                                    $divide: [
                                        {
                                            $subtract: [
                                                new Date(), "$start"
                                            ]
                                        }, 60000
                                    ]
                                }, 100
                            ]
                        }, {
                            $eq: [
                                "$isEnded", false
                            ]
                        }
                    ]
                }
            }
        },
        {
            $match: {
                getEnded: true
            }
        }, {
            $group: {
                _id: "$getEnded",
                ids: {
                    $push: "$_id"
                }
            }
        }, {
            $project: {
                _id: 0,
                ids: 1
            }
        }
    ];
    let ids = await Exam.aggregate(arrAgg);

    if (Object.keys(ids).length == 0) return;

    ids = ids[0]['ids'].map(id => (id.toString()));

    await Exam.updateMany(
        { _id: { $in: ids } },
        { $set: { isEnded: true } }
    );

}

async function areSectionEnded() {

    arrAgg = [
        {
            $addFields: {
                getSectionEnded: {
                    $and: [
                        {
                            $gt: [
                                {
                                    $divide: [
                                        {
                                            $subtract: [
                                                new Date(), "$sectionStartDate"
                                            ]
                                        }, 60000
                                    ]
                                }, 25
                            ]
                        }, {
                            $eq: [
                                "$isEnded", false
                            ]
                        }
                    ]
                }
            }
        },
        {
            $match: {
                getSectionEnded: true
            }
        }, {
            $group: {
                _id: "$getSectionEnded",
                ids: {
                    $push: "$_id"
                }
            }
        }, {
            $project: {
                _id: 0,
                ids: 1

            }
        }
    ];
    let ids = await Exam.aggregate(arrAgg);

    if (Object.keys(ids).length == 0) return;

    ids = ids[0]['ids'].map(id => (id.toString()));

    const updateQuery = {
        $push: { userProgress: 1 },
        sectionStartDate: Date.now()
    }

    await Exam.updateMany(
        { _id: { $in: ids } },
        updateQuery
    );

}


async function isEnded(input) {
    let examId = input.body._id;

    let end = await Exam.findByIdAndUpdate(
        examId,
        { $set: { isEnded: true } },
        { new: true }
    );

    return (end) ? end.isEnded : null;
}


async function editExam(input) {
    let ExamBody = input.body;

    let upd = await Exam.findByIdAndUpdate(
        ExamBody._id,
        { $set: ExamBody },
        { new: true }
    );

    return upd;
}


async function updateProgsAns(input) {
    let { userProgress, answers, examId } = input.body;

    let upd = await Exam.findByIdAndUpdate(
        examId,
        {
            //$push: { answers },
            $addToSet: { userProgress },
            //upate start date
            sectionStartDate: Date.now()
        },
        { new: true }
    );
    upd.answers = { ...upd.answers, ...answers }
    await upd.save()
    return upd;
}


async function getExamAnswers(input) {
    let { _id } = input.params;

    arrAgg = [
        {
            '$match': {
                '_id': mongoose.Types.ObjectId(examId)
            }
        }, {
            '$project': {
                'answers': 1,
                'modelId': 1,
                '_id': 0
            }
        }, {
            '$unwind': {
                'path': '$answers'
            }
        }, {
            '$lookup': {
                'from': 'models',
                'localField': 'modelId',
                'foreignField': '_id',
                'as': 'modelId'
            }
        }, {
            '$addFields': {
                'modelId': {
                    '$arrayElemAt': [
                        '$modelId.sections.questions', 0
                    ]
                }
            }
        },
    ];

    let exm = (await Exam.aggregate(arrAgg))[0];

    let sections = exm.modelId;
    let answers = exm.answers;

    for (let i = 0; i < sections.length; i++) {
        sections[i].
            map((quest) => {
                id = quest._id;
                let answerInd = answers[id];
                let selectedAnswer = quest.answerOptions[answerInd];
                quest.answerInd = answerInd || answerInd == 0 ? answerInd : -1;
                quest.isCorrectAnswer = selectedAnswer ?
                    selectedAnswer.isCorrectAnswer : false;
                return quest;
            });
    }

    return sections;
}

async function getExamReport(input) {
    let sections = await getExamAnswers(input);

    let aggr = [
        {
            '$match': {
                '_id': mongoose.Schema.Types.ObjectId(input.params._id)
            }
        },
        {
            '$lookup': {
                'from': 'users',
                'localField': 'userId',
                'foreignField': '_id',
                'as': 'userId'
            }
        }, {
            '$addFields': {
                'userId': {
                    '$arrayElemAt': [
                        '$userId', 0
                    ]
                }
            }
        },
        {
            '$lookup': {
                'from': 'models',
                'localField': 'modelId',
                'foreignField': '_id',
                'as': 'modelId'
            }
        }, {
            '$addFields': {
                'modelId': {
                    '$arrayElemAt': [
                        '$modelId', 0
                    ]
                }
            }
        },
        {
            '$project': {
                score: 1,
                start: 1,
                finalScore: 1,
                'userId.name': 1,
                'modelId.title': 1,
            }
        }

    ];

    let meta = await Exam.aggregate(aggr);

    return { sections, meta: meta[0] };
}

async function getPDF(input) {
    // let reportData = await getExamReport(input);


    let tmpl = `
    <html>
    <head>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type"> 
        <script>
        function inc(index) {
            add = index + 1;
            return add;
        }
        </script>   
    </head>
    <body dir="rtl">

<div>
 <div>
        <ul style="list-style-type: none;">
            <li>
                <label class='headerText'>اسم النموذج</label> : 
                <label>{{modelTitle}}</label>
            </li>
            <li>
                <label class='headerText'>الدرجة النهائية</label> : 
                <label>{{finalScore}}</label>
            </li>
            <li>
                <label class='headerText'>التاريخ</label> : 
                <label>{{startDate}}</label>
            </li>
            <br/>
            <li>
                <label class='headerText'>اسم الطالب</label> : 
                <label>{{userName}}</label>
            </li>
            <li>
                <label>-----------------------------------------</label>
            </li>
        </ul>
    </div>
        {{#each sections}}
    <div> 
        <div>
            <div class='question'
    >
                {{inc index}} - {{question}}
            </div>
            <span class="ansTyp">
                <span>الإجابة : &nbsp;</span>
                {{#if isCorrectAnswer}}
                <span class='ans-cr g' >
                    صحيحة
                    {{else}}
                <span class='ans-cr r' >
                    خطأ
                    {{/if}}
                </span>
            </span> 
    <table class="tbl">
    {{#each answerOptions}}
    {{#ifEqN @index 2}}</tr><tr>{{/ifEqN}}
    {{#ifEqN @index 0}}<tr>{{/ifEqN}}
    <td>
        <div class="checkbox">
        <input type="checkbox"
           {{#if isCorrectAnswer}}checked {{/if}}
        id="checkbox" />
        
        <label
        {{#ifEq ../answerInd optionNumber}}
        {{#ifEq isCorrectAnswer false}} class="r" {{/ifEq}}
        {{/ifEq}}
        
        {{#ifEq ../answerInd optionNumber}}
        {{#ifEq isCorrectAnswer true}} class="g" {{/ifEq}}
        {{/ifEq}}
        >
            {{answerBody}}
        </label>
        </div>
    </td>
    {{/each}}
    </tr>
    </table>

        </div>
    </div>
    {{/each}}
</div>
    
</body>
</html>

<style>
.ansTyp {
    margin-top: 10px;
    margin-bottom: 15px;
    padding: 5px;
    font-size: 18px;
    background: #f1eccd94;
    border-radius: 10px;
    display: inline-block;
}

.r{
    color: red;
}

.g{
    color: green;
}


.tbl {
    width: 100%;
}

.tbl td {
    table-layout:fixed;
    overflow: hidden;
    width: 50%;
}



/*MME*/

@font-face {
  font-family: 'DroidKufi-Regular';
  src: url({DroidKufi-Regular.ttf @encoding=dataURI});
  format('ttf');
}
    
body {
    font-family: 'DroidKufi-Regular';
}

@media print { body { -webkit-print-color-adjust: exact; } }

.question {
    font-size: 20px;
    background: #f2f2f2;
    padding: 10px;
    border-radius: 10px;
    margin-top: 25px
    
}
.headerText {
    font-size: 20px;
}
.fullWidth {
    display: flex;
    width: 100%;
    border: 1px solid #000;
}
.checkbox {
    margin: 20px;
    position: relative;
  width: 100%;
 word-break: break-all;
}
</style>
`;

    let data = {
        "startDate": "1-3-2019",
        "finalScore": 323,
        "userName": "محمد طاهر على",
        "modelTitle": "نموذج البطة العوامة",
        "sections": [
            {
                "question": "ما هو عدد سور القرءان الكريم ؟",
                "index": 0,
                "answerInd": 3,
                "isCorrectAnswer": true,
                "answerOptions": [
                    {
                        "answerBody": "34",
                        "optionNumber": 0,
                        "isCorrectAnswer": false
                    },
                    {
                        "answerBody": "66",
                        "optionNumber": 1,
                        "isCorrectAnswer": false
                    },
                    {
                        "answerBody": "76",
                        "optionNumber": 2,
                        "isCorrectAnswer": false
                    },
                    {
                        "answerBody": "114",
                        "optionNumber": 3,
                        "isCorrectAnswer": true
                    }
                ]
            },
            {
                "question": "ما هو عدد سور القرءان الكريم ؟",
                "index": 1,
                "answerInd": 2,
                "isCorrectAnswer": false,
                "answerOptions": [
                    {
                        "answerBody": "34",
                        "optionNumber": 0,
                        "isCorrectAnswer": false
                    },
                    {
                        "answerBody": "66",
                        "optionNumber": 1,
                        "isCorrectAnswer": false
                    },
                    {
                        "answerBody": "76",
                        "optionNumber": 2,
                        "isCorrectAnswer": false
                    },
                    {
                        "answerBody": "114",
                        "optionNumber": 3,
                        "isCorrectAnswer": true
                    }
                ]
            }
        ]
    }

    jsreport().init().then(() => {

        jsreport.render({
            template: {
                content: tmpl,
                engine: 'handlebars',
                recipe: 'chrome-pdf',
                helpers: "function ifEq(arg1, arg2, options) { return (arg1 == arg2) ? options.fn(this) : options.inverse(this);} " +
                    "function ifEqN(elm, num, options) {return (elm == num) ? options.fn(this) : options.inverse(this);}" +
                    "function now() {return new Date().toLocaleDateString()}" +
                    "function nowPlus20Days() {var date = new Date();date.setDate(date.getDate() + 20);return date.toLocaleDateString();}" +
                    "function inc(index) {add = index + 1;return add;}" +
                    "function total(items) {var sum = 0;items.forEach(function (i) {console.log('Calculating item ' + i.name + '; you should see this message in debug run');sum += i.price;});return sum;}"
            },
            data: data,   
        }).then((resp) => {
            // write report buffer to a file
            fs.writeFileSync('report.pdf', resp.content)
        });
    }).catch((e) => {
        console.log(e)
    });
}

async function getSingleExam(input) {

    let exam = await Exam.findById(input.body.examId);
    return exam;
}



exports.Exam = Exam;
exports.startExam = startExam;
exports.stopExam = stopExam;
exports.isEnded = isEnded;
exports.areEnded = areEnded;
exports.editExam = editExam;
exports.updateProgsAns = updateProgsAns;
exports.getSingleExam = getSingleExam;
exports.areSectionEnded = areSectionEnded;
exports.getExamAnswers = getExamAnswers;
exports.getPDF = getPDF;