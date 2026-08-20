import {
    Calendar,
    AlertCircle,
    AlertTriangle,
    ShieldCheck,
} from "lucide-react";

const Timeline = () => {
    const headers = [
        "TUE 11",
        "WED 12",
        "THU 13",
        "FRI 14",
        "SAT 15",
        "SUN 16",
        "MON 17",
        "TUE 18",
        "WED 19",
        "THU 20",
        "FRI 21",
        "SAT 22",
    ];

    return (
        <div className="card card-timeline">
            <div className="card-timeline-header">
                <h3>Timeline & Log Kejadian</h3>
                <div className="timeline-date">
                    <Calendar size={14} />
                    <span>Mei 2026</span>
                </div>
            </div>

            <div className="timeline-gantt">
                <div className="timeline-grid-header">
                    {headers.map((h, i) => (
                        <div key={i}>{h}</div>
                    ))}
                </div>

                {/* Row 1: Suhu/PH Alert */}
                <div className="timeline-row">
                    <div
                        className="timeline-bar warning"
                        style={{ gridColumnStart: 1, gridColumnEnd: 5 }}
                    >
                        <div className="timeline-bar-content">
                            <div className="timeline-icon-wrapper icon-warning">
                                <AlertTriangle
                                    size={12}
                                    color="var(--color-warning)"
                                />
                            </div>
                            <span>Suhu/PH Fluktuatif (Upwelling)</span>
                        </div>
                    </div>
                </div>

                {/* Row 2: Nitrate Alert */}
                <div className="timeline-row">
                    <div
                        className="timeline-bar danger"
                        style={{ gridColumnStart: 5, gridColumnEnd: 9 }}
                    >
                        <div className="timeline-bar-content">
                            <div className="timeline-icon-wrapper icon-danger">
                                <AlertCircle
                                    size={12}
                                    color="var(--color-danger)"
                                />
                            </div>
                            <span>Nitrate Puncak (Akumulasi Organik)</span>
                        </div>
                    </div>
                </div>

                {/* Row 3: Normal Monitoring */}
                <div className="timeline-row">
                    <div
                        className="timeline-bar normal"
                        style={{ gridColumnStart: 8, gridColumnEnd: 13 }}
                    >
                        <div className="timeline-bar-content">
                            <div className="timeline-icon-wrapper icon-success">
                                <ShieldCheck
                                    size={12}
                                    color="var(--color-success)"
                                />
                            </div>
                            <span>Pemantauan Normal & Stabil</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Timeline;
