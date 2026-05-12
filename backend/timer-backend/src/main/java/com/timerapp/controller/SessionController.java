package com.timerapp.controller;

import com.timerapp.model.TimerSession;
import com.timerapp.repository.SessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionRepository repository;

    public SessionController(SessionRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<TimerSession> list() {
        return (List<TimerSession>) repository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TimerSession save(@RequestBody TimerSession session) {
        String id = UUID.randomUUID().toString();
        session.setId(id);
        session.setSessionId(id);
        return repository.save(session);
    }
}
