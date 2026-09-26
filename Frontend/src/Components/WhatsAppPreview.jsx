export default function WhatsAppPreview(){
    return (
        <div className="wa-preview" aria-hidden="true">
            <div className="wa-header">
                <div className="wa-avatar">P</div>
                <div className="wa-header-text">
                    <span className="wa-name">Praise</span>
                    <span className="wa-status">Online</span>
                </div>
            </div>

            <div className="wa-body">
                <div className="wa-bubble wa-bubble-in">
                    Guys, who's Birthday is it again?
                </div>

                <div className="wa-bubble wa-bubble-out">
                    <span>Happy birthday Bisi! 🎂 From all of us — have a great one!</span>
                    <span className="wa-meta">
                         9:02 AM <span className="wa-ticks">✓✓</span>
                         </span>
                         </div>
                         <div className="wa-sent-by">Sent automatically by Kaabo</div>
                         </div>
                         
        </div>
    )

}

