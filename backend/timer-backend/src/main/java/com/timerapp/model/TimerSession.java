package com.timerapp.model;

import com.azure.spring.data.cosmos.core.mapping.Container;
import com.azure.spring.data.cosmos.core.mapping.PartitionKey;
import org.springframework.data.annotation.Id;

@Container(containerName = "sessions")
public class TimerSession {

    @Id
    private String id;

    @PartitionKey
    private String sessionId;

    private String startTime;
    private String endTime;
    private long elapsedMs;
    private String label;
    private String timerType;

    public TimerSession() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public long getElapsedMs() { return elapsedMs; }
    public void setElapsedMs(long elapsedMs) { this.elapsedMs = elapsedMs; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getTimerType() { return timerType; }
    public void setTimerType(String timerType) { this.timerType = timerType; }
}
