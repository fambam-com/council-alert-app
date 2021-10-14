# Council Alert App

Work on https://kusama.polkassembly.io/bounty/4

App Download: [Play Store](https://play.google.com/store/apps/details?id=com.meta_dojo.council_alert_app) and [App Store](https://apps.apple.com/us/app/council-alert-app/id1584059076) 

Contact: allan.liang@metadojo.io

### Features
* Proposal Notification: 
  - This contains the overview of the proposal event and a link to the related Polkassembly page
* System.Remark Notification:
  - Only System.Remark signed by the council member or TC member will trigger the notification
  - System.Remark should have the following format:
  - ```
    { 
      "message": string, // required 
      "alertCouncil": true|false, // required, only "true" will trigger the notification
      "level": "medium" | "urgent", // optional, default value is "medium"
      "link": [ // optional
        { 
          "name": string, 
          "url": string
        } 
      ] 
    }
    ```
  - example: 
  - ```
    { 
      "message": "This is an urgent message"
      "level": "urgent",
      "alertCouncil": true,
    }
    ```
  - result: 
  - ![1633921851(1)](https://user-images.githubusercontent.com/48347986/136728118-efbee936-fe2d-4941-ad76-16499f2c73b5.jpg)
* Swipe right to view detail, including clickable external link. Swipe left to snooze.
  - ![info](https://user-images.githubusercontent.com/48347986/136725871-4682688c-1edb-4217-aff9-bf4eb572b82c.gif)![ezgif com-gif-maker](https://user-images.githubusercontent.com/48347986/137231374-95cadf40-430c-4f4b-8ecf-3b484cea5f17.gif)

