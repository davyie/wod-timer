package com.timerapp.repository;

import com.azure.spring.data.cosmos.repository.CosmosRepository;
import com.timerapp.model.TimerSession;
import org.springframework.stereotype.Repository;

@Repository
public interface SessionRepository extends CosmosRepository<TimerSession, String> {}
