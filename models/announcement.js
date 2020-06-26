const Joi = require('joi');
const mongoose = require('mongoose');


const announcementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cat",
        required: true,
    },
    announcementPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AnnouncementPlan",
        required: true,
    },
    avatars: [{
        avatar: String,
        link: String,
    }],
    price: {
        type: Number,
        required: true,
        min: 1
    },
    callsCount: {
        type: Number,
        required: true,
    },
    dateCreate: {
        type: Date,
        default: Date.now
    },
    isNeglected: {
        type: Boolean,
        default: false
    },
});


const Announcement = mongoose.model('Announcement', announcementSchema);



async function getAnnouncements(input) {

    let aggr = [
        {
          '$match': {
            'isNeglected': false,
          }
        },
            {
            '$lookup': {
              'from': 'announcementplans', 
              'localField': 'announcementPlan', 
              'foreignField': '_id', 
              'as': 'announcementPlans'
            }
        },
        {
            '$unwind': {
              'path': '$announcementPlans',
              'preserveNullAndEmptyArrays': true
            }
          },
          {
            '$addFields': {
              'avatars._id': "$_id",
            }
          },
      ];
      let getAnnouncements = await Announcement.aggregate(aggr);
      if(getAnnouncements.length != 0)
      {
        let Announcements = [];
        let currentDate = new Date();
        getAnnouncements = getAnnouncements.map(announce=>{
            if(announce.announcementPlans.fromDate<= currentDate && currentDate <= announce.announcementPlans.toDate ){
            return announce.avatars.map(avatar=>{
                avatar.avatar = input.app.get('defaultAvatar')(input, 'host') + avatar.avatar;
                Announcements.push(avatar);
                return avatar;
            });
            }
        })
        return (Announcements);
     }
    
     
  }





module.exports = {
    Announcement,
    getAnnouncements,
}


